import { S3Client } from "@aws-sdk/client-s3";
import { StartDocumentAnalysisCommand, StartDocumentAnalysisCommandInput, TextractClient } from "@aws-sdk/client-textract";
import { readTextractResult } from "../common/textract.helper";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const textractClient = new TextractClient();

const formQuestions: Record<string, any> = {
    "join_vanguard_super_spendsmart_and_transitionsmart": {
        "QueriesConfig": {
            "Queries": [
                {
                    "Alias": "person.firstName",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person First name"
                },
                {
                    "Alias": "person.middleName",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Middle name"
                },
                {
                    "Alias": "person.lastName",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Surname"
                },
                {
                    "Alias": "person.gender",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Gender"
                },
                {
                    "Alias": "person.dateOfBirth",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Date of birth"
                },
                {
                    "Alias": "person.vanguardId",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Vanguard Super member number"
                },
                {
                    "Alias": "person.residentialAddress.addressOne",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Australian residential address"
                },
                {
                    "Alias": "person.residentialAddress.suburb",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Suburb*"
                },
                {
                    "Alias": "person.residentialAddress.postCode",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Postcode*"
                },
                {
                    "Alias": "person.residentialAddress.state",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person State*"
                },
                {
                    "Alias": "person.phoneNumber",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Mobile"
                },
                {
                    "Alias": "person.email",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Person Email address"
                },
                {
                    "Alias": "person.occupation",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Person Occupation"
                },
                {
                    "Alias": "person.sourceOfFunds",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Person Source of funds"
                },
                {
                    "Alias": "account.type",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Which Account to open"
                },
                {
                    "Alias": "account.taxDeductions",
                    "Pages": [
                        "4"
                    ],
                    "Text": "Have you finalised any tax deductions you intend to claim for your personal super contributions"
                },
                {
                    "Alias": "account.paymentFrequency",
                    "Pages": [
                        "5"
                    ],
                    "Text": "Payment frequency"
                },
                {
                    "Alias": "account.whenToStart",
                    "Pages": [
                        "5"
                    ],
                    "Text": "When would you like your pension payments to start"
                },
                {
                    "Alias": "account.bankName",
                    "Pages": [
                        "6"
                    ],
                    "Text": "Name of bank"
                },
                {
                    "Alias": "account.bankBsb",
                    "Pages": [
                        "6"
                    ],
                    "Text": "BSB"
                },
                {
                    "Alias": "account.bankAccountNumber",
                    "Pages": [
                        "6"
                    ],
                    "Text": "Account number"
                },
                {
                    "Alias": "account.bankStatementCopy",
                    "Pages": [
                        "6"
                    ],
                    "Text": "Is \"I have attached a copy of a bank statement\" ticked"
                }
            ]
        }
    },
    "default": {
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

    const resultMap = await readTextractResult(s3Client, "hackathon-textract-results", "type", message.JobId)
    console.log(resultMap)

    var result = resultMap?.find((b: any) => b.key == "form_name");
    console.log(result)
    // lowercase value and replace spaces with _
    var formKey: string = result?.value.toLowerCase().replace(/ /g, "_");
    var formKey = formQuestions[formKey] ? formKey : "default"
    console.log(formKey)
    return await startDocumentAnalysis(message.DocumentLocation.S3Bucket,
        message.DocumentLocation.S3ObjectName, formQuestions[formKey])
}