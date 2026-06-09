from pydantic import BaseModel, ConfigDict


class AppModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
        serialize_by_alias=True,   # ← добавить это
    )

