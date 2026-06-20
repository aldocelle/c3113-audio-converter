import uvicorn
from app.application import create_app
from app.config import settings

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.app_host,
        port=settings.app_port,
        log_level=settings.log_level.lower(),
    )
