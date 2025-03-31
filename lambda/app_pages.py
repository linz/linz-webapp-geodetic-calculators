import logging
import os
from typing import NamedTuple

from lambda_alb_target_responses import (
    exceptionResponse,
    redirectResponse,
    fileResponse,
    errorResponse,
)

AppsDirRoot = os.path.join(os.path.dirname(os.path.realpath(__file__)), "calculators")


if os.environ.get("DEBUG_CALCULATORS", "N").upper() == "Y":
    logging.getLogger().setLevel(logging.DEBUG)
    logging.getLogger("boto3").setLevel(logging.ERROR)
    logging.getLogger("botocore").setLevel(logging.ERROR)
    logging.getLogger("urllib3").setLevel(logging.ERROR)


class Application(NamedTuple):
    urlPath: str
    appdir: str


CalcApps = [
    Application(os.environ["NZMAPCONV_URL"], "nzmapconv"),
    Application(os.environ["PROJCORR_URL"], "projection-correction"),
    Application(os.environ["TRAVCALC_URL"], "traverse-calculator"),
]


def handleEvent(event, context):
    logging.debug(f"Event: {event}")
    path = event.get("path", "")

    for app in CalcApps:
        if path == app.urlPath:
            return redirectResponse(app.urlPath + "/index.html", event, True)
        if path.startswith(app.urlPath + "/"):
            if path == app.urlPath + "/":
                path = path + "index.html"
                return redirectResponse(app.urlPath + "/index.html", event, True)
            filepath = os.path.join(
                AppsDirRoot, app.appdir, path[len(app.urlPath) + 1 :]
            )
            logging.debug(f"Sending filepath: {filepath}")
            return fileResponse(filepath, 3600)
    return errorResponse("Invalid calculator app", 404)
