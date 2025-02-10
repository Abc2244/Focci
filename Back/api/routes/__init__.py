from .auth_routes import router as auth_router
from .users import router as users_router
from .subjects import router as subjects_router
from .tasks import router as tasks_router
from .reminders import router as reminders_router

__all__ = [
    "auth_router",
    "users_router",
    "subjects_router",
    "tasks_router",
    "reminders_router"
]
