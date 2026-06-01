import logging
import re
import time
import json
import socket
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger("dw_backend")

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


def _is_rate_limit_error(exc: Exception) -> bool:
    message = str(exc).lower()
    status_code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    return status_code == 429 or "429" in message or "quota" in message or "rate" in message


def _retry_delay_from_error(exc: Exception) -> float:
    retry_delay = getattr(exc, "retry_delay", None)
    delay = _seconds_from_retry_delay(retry_delay)
    if delay is not None:
        return delay

    for detail in getattr(exc, "details", []) or []:
        delay = _seconds_from_retry_delay(getattr(detail, "retry_delay", None))
        if delay is not None:
            return delay

    match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", str(exc), re.IGNORECASE)
    if match:
        return float(match.group(1))

    return float(settings.llm_retry_delay_seconds)


def _seconds_from_retry_delay(retry_delay: object | None) -> float | None:
    if retry_delay is None:
        return None

    seconds = getattr(retry_delay, "seconds", None)
    nanos = getattr(retry_delay, "nanos", 0) or 0
    if seconds is not None:
        return float(seconds) + float(nanos) / 1_000_000_000

    try:
        return float(retry_delay)
    except (TypeError, ValueError):
        return None


def call_llm(prompt: str) -> str | None:
    provider = settings.llm_provider.lower().strip()

    if provider == "none":
        logger.info("LLM provider=none. Usando fallback local.")
        return None

    if provider == "gemini":
        return _call_gemini(prompt)

    if provider == "openai":
        return _call_openai(prompt)

    if provider == "groq":
        return _call_groq(prompt)

    logger.warning("Provedor LLM desconhecido: %s. Usando fallback local.", provider)
    return None


def _call_gemini(prompt: str) -> str | None:
    if not settings.gemini_api_key:
        logger.warning("Provider Gemini solicitado, mas GEMINI_API_KEY nao foi configurada. Usando fallback local.")
        return None

    model_name = settings.llm_model or "gemini-1.5-flash"
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(model_name)
    except ImportError:
        logger.error("SDK google-generativeai nao esta instalado. Usando fallback local.")
        return None
    except Exception as exc:
        logger.error("Falha ao inicializar Gemini | provider=gemini | modelo=%s | erro=%s", model_name, exc)
        return None

    logger.info(
        "Chamando LLM | provider=gemini | modelo=%s | timeout=%ss",
        model_name,
        settings.llm_timeout_seconds,
    )

    for attempt in range(2):
        try:
            response = model.generate_content(
                prompt,
                request_options={"timeout": settings.llm_timeout_seconds},
            )
            logger.info("LLM respondeu | provider=gemini | modelo=%s | tentativa=%s", model_name, attempt + 1)
            return getattr(response, "text", None)
        except Exception as exc:
            if _is_rate_limit_error(exc) and attempt == 0:
                delay = _retry_delay_from_error(exc)
                logger.warning(
                    "Gemini retornou 429/rate limit. Retry simples apos %.2fs | provider=gemini | modelo=%s | erro=%s",
                    delay,
                    model_name,
                    exc,
                )
                time.sleep(delay)
                continue

            if _is_rate_limit_error(exc):
                logger.warning(
                    "Gemini indisponivel por rate limit/cota. Usando fallback local | provider=gemini | modelo=%s | erro=%s",
                    model_name,
                    exc,
                )
            else:
                logger.error(
                    "Erro na chamada Gemini. Usando fallback local | provider=gemini | modelo=%s | erro=%s",
                    model_name,
                    exc,
                )
            return None

    return None


def _call_openai(prompt: str) -> str | None:
    if not settings.openai_api_key:
        logger.warning("Provider OpenAI solicitado, mas OPENAI_API_KEY nao foi configurada. Usando fallback local.")
        return None


def _call_groq(prompt: str) -> str | None:
    if not settings.groq_api_key:
        logger.warning("Provider Groq solicitado, mas GROQ_API_KEY nao foi configurada. Usando fallback local.")
        return None

    model_name = settings.llm_model or "llama-3.1-8b-instant"
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
    }
    request = urllib.request.Request(
        GROQ_CHAT_COMPLETIONS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "DW-Rio-Claro/1.0"
        },
        method="POST",
    )

    logger.info(
        "Chamando LLM | provider=groq | modelo=%s | timeout=%ss",
        model_name,
        settings.llm_timeout_seconds,
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.llm_timeout_seconds) as response:
            raw_body = response.read().decode("utf-8")
        body = json.loads(raw_body)
        text = body.get("choices", [{}])[0].get("message", {}).get("content")
        if not text:
            logger.warning("Groq retornou resposta vazia. Usando fallback local | provider=groq | modelo=%s", model_name)
            return None

        logger.info("LLM respondeu com sucesso | provider=groq | modelo=%s", model_name)
        return text
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        '''
        if exc.code == 429:
            logger.warning(
                "Groq retornou rate limit 429. Usando fallback local | provider=groq | modelo=%s | erro=%s",
                model_name,
                exc,
            )
        else:
            logger.error(
                "Erro HTTP na chamada Groq. Usando fallback local | provider=groq | modelo=%s | status=%s | erro=%s",
                model_name,
                exc.code,
                exc,
                error_body,
            )
            '''
        logger.error(
            "Erro HTTP na chamada Groq | status=%s | body=%s",
            exc.code,
            error_body
        )
        return None
    except (TimeoutError, socket.timeout) as exc:
        logger.warning(
            "Timeout na chamada Groq. Usando fallback local | provider=groq | modelo=%s | erro=%s",
            model_name,
            exc,
        )
        return None
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(
                "Groq retornou rate limit/cota. Usando fallback local | provider=groq | modelo=%s | erro=%s",
                model_name,
                exc,
            )
        else:
            logger.error(
                "Erro na chamada Groq. Usando fallback local | provider=groq | modelo=%s | erro=%s",
                model_name,
                exc,
            )
        return None