from app.db.base_class import Base  # noqa: F401

# Import all models so Alembic detects them during autogenerate
from app.models.user import User  # noqa: F401
from app.models.prompt import Prompt  # noqa: F401
from app.models.template import Template  # noqa: F401
from app.models.history import PromptHistory  # noqa: F401
