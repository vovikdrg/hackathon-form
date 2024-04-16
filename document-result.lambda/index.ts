import { S3Client } from "@aws-sdk/client-s3";
import { calculateMean, calculateStdDev, convertMapToObject, readTextractResult } from "../common/textract.helper";
import { DynamoDBClient, PutItemCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-2" });
const sqsClient = new SQSClient({ region: "ap-southeast-2" });


export const handler = async (event: any) => {
    console.log(JSON.stringify(event))
    const message = JSON.parse(event.Records[0].Sns.Message)
    console.log(message)
    const resultMap = await readTextractResult(s3Client, "hackathon-textract-results", "results", message.JobId)
    // search in dynamodb using GSI filename-index
    var params: QueryCommandInput = {
        TableName: "document",
        IndexName: "filename-index",
        KeyConditionExpression: "filename = :filename",
        ExpressionAttributeValues: {
            ":filename": { S: message.DocumentLocation.S3ObjectName }
        }
    };
    const getCommand = new QueryCommand(params);
    const queryResponse = await dynamoDbClient.send(getCommand);
    var item = queryResponse.Items![0]
    console.log(item)
    item.status.S = "PARSED";
    //write mean of confidence to dynamodb
    
    item.confidence = { N: calculateMean(resultMap!).toString() }
    item.stdDev = { N: calculateStdDev(resultMap!).toString() }
    // convert resultMap array to object

   
    item.result = { S: JSON.stringify(resultMap) }
    item.details = { S: JSON.stringify(convertMapToObject(resultMap!)) }

    const input = {
        "Item": {
            ...item
        },
        "TableName": "document"
    };
    const command = new PutItemCommand(input);
    await dynamoDbClient.send(command);
    await sqsClient.send(new SendMessageCommand({
        QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/732757519306/DocumentParsedQueue",
        MessageBody: JSON.stringify({ filename: message.DocumentLocation.S3ObjectName })
    }));
    console.log("Document parsed")
    return resultMap
}