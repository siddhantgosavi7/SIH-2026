from pydantic import BaseModel, Field


class EmailIntake(BaseModel):
    subject: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=20, max_length=5000)
    affected_users: int = Field(default=1, ge=1, le=100000)
