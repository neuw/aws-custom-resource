import {DataMapper} from "@aws/dynamodb-data-mapper";
//import {DynamoDB} from "aws-sdk";
import DynamoDB from "aws-sdk/clients/dynamodb";

const APP_STAGE:string = process.env.APP_STAGE || 'dev';
const TABLE_PREFIX:string = APP_STAGE+"-";

export class ClientsMapper {

    dataMapper: DataMapper;
    dynamoDb: DynamoDB;

    constructor() {
        this.dynamoDb = new DynamoDB();
        this.dataMapper = new DataMapper({
            client: this.dynamoDb,
            tableNamePrefix: TABLE_PREFIX
        });
    }

    public getDynamoClient(): DynamoDB {
        return this.dynamoDb;
    }

    public getDataMapper(): DataMapper {
        return this.dataMapper;
    }

}
