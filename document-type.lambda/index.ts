import { S3Client, ListBucketsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { StartDocumentAnalysisCommand, StartDocumentAnalysisCommandInput, TextractClient } from "@aws-sdk/client-textract";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const textractClient = new TextractClient();

const formQuestions = {
    "vanguard_au_super_join": {
        "QueriesConfig": {
            "Queries": [
                {
                    "Alias": "person_first_name",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person First name"
                },
                {
                    "Alias": "person_last_name",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Surname"
                },
                {
                    "Alias": "person_gender",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Gender"
                },
                {
                    "Alias": "person_vanguard_number",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Vanguard Super member numbe"
                }
            ]
        }
    }
}

const startDocumentAnalysis = async (bucket: any, key: any, queryConfig: any) => {
    const params: StartDocumentAnalysisCommandInput = {
        "DocumentLocation": {
            "S3Object": {
                "Bucket": bucket,
                "Name": key
            }
        },
        "FeatureTypes": [
            "QUERIES"
        ],
        "OutputConfig": {
            "S3Bucket": "hackathon-textract-results",
            "S3Prefix": "results"
        },
        "NotificationChannel": {
            "RoleArn": "arn:aws:iam::732757519306:role/Textract",
            "SNSTopicArn": "arn:aws:sns:ap-southeast-2:732757519306:DocumentProcessed"
        },
        AdaptersConfig: {
            Adapters: [
                {
                    "AdapterId": "829b7c54d9c9",
                    "Pages": [
                        "*"
                    ],
                    "Version": "3"
                }
            ]
        },
        ...queryConfig
    };
    console.log(params)
    var startDocumentAnalysisCommand = new StartDocumentAnalysisCommand(params);
    return await textractClient.send(startDocumentAnalysisCommand);
}

exports.handler = async (event: any) => {
    const message = JSON.parse(event.Records[0].Sns.Message)
    console.log(JSON.stringify(event))
    const params = {
        Bucket: "hackathon-textract-results",
        Key: `type/${message.JobId}/1`
    };
    console.log(params)
    var json: any;
    try {
        const data = await s3Client.send(new GetObjectCommand(params));

        json = JSON.parse(await data.Body?.transformToString() ?? "");
    }
    catch (e) {
        console.error(params, e);
        throw e;
    }


    var result = json.Blocks.find((b: any) => b.BlockType == "QUERY_RESULT");
    var resultObject = { "form_type": "unknown" }
    if (result.Text == "Yes") {
        return startDocumentAnalysis(message.DocumentLocation.S3Bucket, message.DocumentLocation.S3ObjectName, formQuestions["vanguard_au_super_join"])
    }
    return resultObject
}