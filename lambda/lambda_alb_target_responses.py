import mimetypes
import base64
import json
import traceback
import logging
from datetime import datetime
from urllib.parse import urlparse, urlunparse


def fileResponse(filepath, maxcacheage=0):
    try:
        content = open(filepath, "rb").read()
        statusCode = 200
        encoded = False
        mimetype = mimetypes.guess_type(filepath)[0]
        try:
            body = content.decode("utf8")
        except UnicodeError:
            encoded = True
            body = base64.b64encode(content).decode("utf8")
    except Exception as ex:
        logging.error(f"Error for filepath {filepath}: {ex}")

        statusCode = 404
        body = "Not found"
        mimetype = "text/plain"
        encoded = False

    headers = {"Content-Type": mimetype}
    if maxcacheage > 0:
        headers["CacheControl"] = f"max-age={maxcacheage}"
    return {
        "statusCode": statusCode,
        "isBase64Encoded": encoded,
        "headers": headers,
        "body": body,
    }


def _jsonSerializeDatetime(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return TypeError("Not datetime")


def objectJsonResponse(result, contenttype="application/json; charset=utf-8"):
    result = json.dumps(result, sort_keys=True, default=_jsonSerializeDatetime)
    return {
        "statusCode": 200,
        "isBase64Encoded": False,
        "headers": {
            "Content-Type": contenttype,
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
        "body": result,
    }


def textResponse(text, contenttype="text/plain"):
    logging.debug(f"Text response: |{text}|{contenttype}|")
    return {
        "statusCode": 200,
        "isBase64Encoded": False,
        "headers": {"Content-Type": contenttype},
        "body": text,
    }


def exceptionResponse(exception, statusCode=500):
    logging.error(f"Exception: {''.join(traceback.format_exception(exception))}")
    return {
        "statusCode": statusCode,
        "isBase64Encoded": False,
        "headers": {"Content-Type": "text/plain"},
        "body": "",
    }


def errorResponse(error, statusCode=501):
    return {
        "statusCode": statusCode,
        "isBase64Encoded": False,
        "headers": {"Content-Type": "text/plain"},
        "body": error,
    }


def redirectResponse(path, event={}, permanent=False):
    headers = event.get("headers", {})
    server = headers.get("x-servername")
    if server is not None:
        parts = urlparse(path)
        sparts = urlparse(server)
        parts = parts._replace(scheme=sparts.scheme, netloc=sparts.netloc)
        path = urlunparse(parts)
    return {
        "statusCode": 308 if permanent else 307,
        "headers": {"Location": path},
    }


def requestAuthorizationResponse(realm, logout=False):
    return {
        "statusCode": 401,
        "headers": {} if logout else {"WWW-Authenticate": f'Basic realm="{realm}"'},
        "body": "Authorization required",
    }


def validateAuthorizationHeader(event, validateFunction):
    headers = event.get("headers", {})
    auth = headers.get("authorization")
    if not auth:
        logging.debug("No authorization header")
        return None
    if not auth.startswith("Basic "):
        logging.debug("Authorization header is not for Basic authentication")
        return None
    auth = auth[6:]
    try:
        auth = base64.b64decode(auth).decode("utf8")
    except Exception as ex:
        logging.error(f"Error decoding authorization header: {ex}")
        return None
    auth = auth.split(":", 1)
    if len(auth) != 2:
        logging.debug("Invalid authorization - need user and password")
        return
    userid, password = auth
    logging.debug(f"Authenticating userid: {userid}")
    if userid == "":
        return "logout"
    if not userid or not password:
        logging.debug("Empty userid or password")
        return None
    # extract token from userid and password
    if not validateFunction(userid, password):
        logging.debug(f"Validation of userid {userid} failed")
        return None
    return userid
