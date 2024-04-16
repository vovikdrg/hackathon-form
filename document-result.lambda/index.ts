import { S3Client } from "@aws-sdk/client-s3";
import { calculateMean, calculateStdDev, convertMapToObject, readTextractResult } from "../common/textract.helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { findFileRecord, saveDocument } from "../common/dynamo.db.helper";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-2" });
const sqsClient = new SQSClient({ region: "ap-southeast-2" });


export const handler = async (event: any) => {
    console.log(JSON.stringify(event))
    const message = JSON.parse(event.Records[0].Sns.Message)
    const fileName = message.DocumentLocation.S3ObjectName.replace("upload/", "")
    const resultMap = await readTextractResult(s3Client, "hackathon-textract-results", "results", message.JobId)
    // search in dynamodb using GSI filename-index
    var queryResponse = await findFileRecord(dynamoDbClient, fileName)
    var item = queryResponse.Items![0]
    item.status.S = "PARSED";
    //write mean of confidence to dynamodb

    item.confidence = { N: calculateMean(resultMap!).toString() }
    item.stdDev = { N: calculateStdDev(resultMap!).toString() }
    // convert resultMap array to object


    item.result = { S: JSON.stringify(resultMap) }
    item.details = { S: JSON.stringify(convertMapToObject(resultMap!)) }

    await saveDocument(dynamoDbClient, item);
    if (item.form_type.S == "join_vanguard_super_spendsmart_and_transitionsmart") {
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/732757519306/DocumentParsedQueue",
            MessageBody: JSON.stringify({ filename: fileName })
        }));
    }
    console.log("Document parsed")
    return resultMap
}