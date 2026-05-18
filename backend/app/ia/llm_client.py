import logging
from app.config import settings

logger = logging.getLogger("dw_backend")

def call_llm(prompt: str) -> str | None:
    """
    Interface unificada para chamada a APIs externas de LLM (Gemini ou OpenAI).
    Caso o provedor seja 'none', retorna None (desvia para os templates locais).
    
    Protege contra falhas de inicialização e de importação caso as bibliotecas
    google-generativeai ou openai não estejam instaladas nas dependências básicas.
    """
    provider = settings.llm_provider.lower().strip()
    
    if provider == "none":
        logger.info("Provedor LLM configurado como 'none'. Fallback ativado para dicionário local.")
        return None
        
    if provider == "gemini":
        if not settings.gemini_api_key:
            logger.warning("Provedor Gemini solicitado, mas GEMINI_API_KEY não foi configurada.")
            return None
        try:
            # Importa de forma condicional para evitar erros em ambientes sem o pacote instalado
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model_name = settings.llm_model or "gemini-1.5-flash"
            logger.info(f"Efetuando chamada de IA ao Gemini (Modelo: {model_name})")
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text
        except ImportError:
            logger.error("SDK 'google-generativeai' não está instalado no ambiente. Instale com pip install google-generativeai.")
            return "Erro: O pacote 'google-generativeai' está ausente no ambiente do contêiner."
        except Exception as e:
            logger.error(f"Erro na execução da API do Gemini: {e}")
            return f"Ocorreu uma falha ao contatar a API do Google Gemini: {str(e)}"
            
    if provider == "openai":
        if not settings.openai_api_key:
            logger.warning("Provedor OpenAI solicitado, mas OPENAI_API_KEY não foi configurada.")
            return None
        try:
            import openai
            model_name = settings.llm_model or "gpt-4o"
            logger.info(f"Efetuando chamada de IA à OpenAI (Modelo: {model_name})")
            
            client = openai.OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except ImportError:
            logger.error("SDK 'openai' não está instalado no ambiente. Instale com pip install openai.")
            return "Erro: O pacote 'openai' está ausente no ambiente do contêiner."
        except Exception as e:
            logger.error(f"Erro na execução da API da OpenAI: {e}")
            return f"Ocorreu uma falha ao contatar a API da OpenAI: {str(e)}"
            
    logger.warning(f"Provedor de LLM desconhecido cadastrado: '{provider}'. Redirecionando para dicionário local.")
    return None
