import {
    CloudFormationCustomResourceEvent,
    CloudFormationCustomResourceFailedResponse,
    CloudFormationCustomResourceSuccessResponse,
    Context
} from "aws-lambda";
import cfResponse from "./cfResponseHelper";
import {DataMapper} from "@aws/dynamodb-data-mapper";
import {ClientsMapper} from "../data/mapper/clients-mapper";
import {Clients} from "../data/model/clients";

const APP_STAGE: string = process.env.APP_STAGE || 'dev';
const TABLE_PREFIX: string = APP_STAGE + "-";

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context): Promise<CloudFormationCustomResourceSuccessResponse | CloudFormationCustomResourceFailedResponse> => {

    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let cfCallbackResponseSuccessful: boolean = false;
    let client_name: string = "UNKNOWN";
    let cloudformationResponseUrl: string;
    let cfResponseCallbackBody: any = {};

    let clientsMapper: ClientsMapper = new ClientsMapper();
    let clientsDataMapper: DataMapper = clientsMapper.dataMapper;

    try {

        cloudformationResponseUrl = event.ResponseURL;
        let client_id: string = event.ResourceProperties.client_id;
        let user_pool_name: string = event.ResourceProperties.user_pool_name;
        let user_pool_id: string = event.ResourceProperties.user_pool_id;
        let account_name: string = event.ResourceProperties.account_name;
        client_name = event.ResourceProperties.client_name;

        await clientsDataMapper.ensureTableExists(Clients, {
            readCapacityUnits: 1,
            writeCapacityUnits: 1
        }).then(() => {
            console.log("TABLE clients CREATED/ EXISTED SUCCESSFULLY!");
        }).catch(e => {
            console.log("ISSUE WHILE CREATING THE clients TABLE!!");
            console.error(e);
            throw new Error("ISSUE WHILE CREATING THE clients TABLE!!");
        });

        let client:Clients = new Clients();
        client.id = client_name;

        await clientsDataMapper.get(client).then(async (existingClient:Clients) => {
            console.log("========== ITEM ENTRY FETCHED FROM THE "+TABLE_PREFIX+"clients TABLE ==========");
            existingClient.client_name = client_name;
            existingClient.account = account_name;
            existingClient.client_id = client_id;
            existingClient.user_pool_id = user_pool_id;
            existingClient.user_pool_name = user_pool_name;
            existingClient.updated_at = new Date();
            return await clientsDataMapper.update(existingClient).then((updatedExistingClient:Clients) => {
                return updatedExistingClient;
            }).catch(async e => {
                console.error("========== ITEM UPDATE ISSUE ===========");
                console.debug(e);
                status = "FAILED";
                return existingClient;
            });
        }).catch(async e => {
            console.info("========== ITEM FETCH ISSUE ===========");
            console.info(e);
            console.error("========== ITEM FETCH ISSUE ===========");
            console.error(e);
            client.client_name = client_name;
            client.account = account_name;
            client.client_id = client_id;
            client.user_pool_id = user_pool_id;
            client.user_pool_name = user_pool_name;
            client.created_at = new Date();
            client.updated_at = new Date();
            if (e.name === "ItemNotFoundException") {
                console.log('Item not found in '+TABLE_PREFIX+'clients table with id -> ' + client_name);
                await clientsDataMapper.put(client).then((createClient) => {
                    console.log('========== ITEM CREATED ===========')
                    console.log('========== CLIENT CREATED FOR THE '+client.client_name+' ===========')
                    return createClient;
                }).catch(es => {
                    status = "FAILED";
                    console.error("========== ITEM CREATION ISSUE ===========");
                    console.debug(es);
                })
            }
        });

    } catch (e) {
        status = "FAILED";
        console.error(e);
        console.error("ERROR while processing the custom resource input " + e.message);
    }

    cfResponseCallbackBody = {
        Status: status,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: false,
        Data: {
            status: status
        }
    };

    try {
        cfCallbackResponseSuccessful = await cfResponse(cloudformationResponseUrl, cfResponseCallbackBody)
    } catch (e) {
        cfCallbackResponseSuccessful = false;
        console.error(e);
        console.error("ERROR while processing the custom resource response callback " + e.message);
    }


    if (cfCallbackResponseSuccessful === true && status === 'SUCCESS') {

        let result: CloudFormationCustomResourceSuccessResponse = {
            Status: 'SUCCESS',
            Reason: "SUCCESS - the details in CloudWatch Log Stream: " + context.logStreamName,
            PhysicalResourceId: context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: false,
            Data: {
                result: cfCallbackResponseSuccessful,
                client_name: client_name
            }
        }

        return result;
    } else {

        let result: CloudFormationCustomResourceFailedResponse = {
            Status: 'FAILED',
            Reason: "FAILED - the details in CloudWatch Log Stream: " + context.logStreamName,
            PhysicalResourceId: context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: false,
            Data: {
                result: cfCallbackResponseSuccessful,
                client_name: client_name
            }
        }

        return result;
    }

}
