import time
import httpx
from sqlalchemy.orm import Session

from app.models.monitor import Monitor as MonitorModel
from app.crud.check_result import create_check_result

def perform_http_check(target_url: str, timeout: float = 10.0) -> dict:
    """
    do http-request to target_url and return dict with results:
    is_up, status_code, response_time_ms, error_message
    """
    start = time.monotonic()
    status_code: int | None = None
    error_message: str | None = None
    is_up = False
    response_time_ms: int | None = None

    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(target_url)

        elapsed_ms = int((time.monotonic() - start) * 1000.0)
        response_time_ms = elapsed_ms
        status_code = response.status_code
        is_up = 200 <= response.status_code < 400

    except httpx.RequestError as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000.0)
        response_time_ms = elapsed_ms
        error_message = str(exc)
        is_up = False

    return {
        "is_up": is_up,
        "status_code": status_code,
        "response_time_ms": response_time_ms,
        "error_message": error_message,
    }


def check_monitor_once(db: Session, monitor: MonitorModel):
    """
    Execute one monitor check:
    - http-request
    - save result in bd
    - return created CheckResult
    """
    result_data = perform_http_check(monitor.target_url)

    result = create_check_result(
        db=db,
        monitor_id=monitor.id,
        is_up=result_data["is_up"],
        status_code=result_data["status_code"],
        response_time_ms=result_data["response_time_ms"],
        error_message=result_data["error_message"]
    )
    return result















