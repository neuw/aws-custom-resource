import {StatusCodes} from "http-status-codes";
import fetch from "node-fetch";

let cfResponse = async (responseURL:string, responseBody:any):Promise<boolean> => {
    return await fetch(responseURL, {
        headers: {'Content-Type': 'application/json'},
        method: 'PUT',
        body: JSON.stringify(responseBody)
    }).then((r) => {
        if (r.status === StatusCodes.OK) {
            return true;
        } else {
            /*response.body = JSON.stringify({
                ...body,
                message: 'google recaptcha issues'
            });*/
            return false
        }
    });
}

export default cfResponse;
