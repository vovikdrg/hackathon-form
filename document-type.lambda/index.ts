import { S3Client } from "@aws-sdk/client-s3";
import { StartDocumentAnalysisCommand, StartDocumentAnalysisCommandInput, TextractClient } from "@aws-sdk/client-textract";
import { ADAPTER_VERSION, readTextractResult } from "../common/textract.helper";
import { findFileRecord, saveDocument } from "../common/dynamo.db.helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const s3Client = new S3Client({ region: "ap-southeast-2" });
const textractClient = new TextractClient();
const dynamoDbClient = new DynamoDBClient({ region: "ap-southeast-2" });

const formQuestions: Record<string, any> = {
    "vanguard_professional_client_application_form_for_institutions_companies_and_intermediaries": {
        "QueriesConfig": {
            "Queries": [
                {
                    "Alias": "account.number",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Account Number"
                },
                {
                    "Alias": "company.name",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Company/Entity name"
                },
                {
                    "Alias": "company.number",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Registered number"
                },
                {
                    "Alias": "account.address",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Address"
                },
                {
                    "Alias": "account.town",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Town"
                },
                {
                    "Alias": "account.postcode",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Postcode"
                },
                {
                    "Alias": "account.industry",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Industry"
                },
                {
                    "Alias": "account.industry",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Email"
                },
                {
                    "Alias": "account.contactName",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Contact name"
                },
                {
                    "Alias": "account.telNo",
                    "Pages": [
                        "1"
                    ],
                    "Text": "Applicant Tel no."
                },
                {
                    "Alias": "investor_type",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Investor Type for Anti-Money Laundering Purposes"
                },
                {
                    "Alias": "agent.address",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent Registered address"
                },
                {
                    "Alias": "agent.town",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent Town"
                },
                {
                    "Alias": "agent.postcode",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent Postcode"
                },
                {
                    "Alias": "agent.contactName",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent Contact name"
                },
                {
                    "Alias": "agent.email",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent contact email address"
                },
                {
                    "Alias": "agent.telNo",
                    "Pages": [
                        "2"
                    ],
                    "Text": "Agent contact telephone number"
                },
                {
                    "Alias": "investment.fundName",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Investment fund name"
                },
                {
                    "Alias": "investment.ISIN",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Investment ISIN"
                },
                {
                    "Alias": "investment.unitAmount",
                    "Pages": [
                        "3"
                    ],
                    "Text": "Investment Unit Amount"
                }
            ]
        }
    },
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
                    "Text": "Occupation (if you have already retired, please provide your most recent occupation before retiring)*"
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
                        "5"
                    ],
                    "Text": "Have you finalised any tax deductions you intend to claim for your personal super contributions"
                },
                {
                    "Alias": "account.paymentFrequency",
                    "Pages": [
                        "7"
                    ],
                    "Text": "Payment frequency"
                },
                {
                    "Alias": "account.whenToStart",
                    "Pages": [
                        "7"
                    ],
                    "Text": "When would you like your pension payments to start"
                },
                {
                    "Alias": "account.bankName",
                    "Pages": [
                        "10"
                    ],
                    "Text": "Name of bank"
                },
                {
                    "Alias": "account.bankBsb",
                    "Pages": [
                        "10"
                    ],
                    "Text": "BSB"
                },
                {
                    "Alias": "account.bankAccountNumber",
                    "Pages": [
                        "10"
                    ],
                    "Text": "Account number"
                },
                {
                    "Alias": "account.bankStatementCopy",
                    "Pages": [
                        "10"
                    ],
                    "Text": "Is \"I have attached a copy of a bank statement\" ticked"
                },
                {
                    "Alias": "kyc.medicare.fullName",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Medicare details Full Name"
                }
                ,
                {
                    "Alias": "kyc.medicare.number",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Medicare number"
                },
                {
                    "Alias": "kyc.medicare.ref",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Medicare card ref. no."
                },
                {
                    "Alias": "kyc.medicare.validTo",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Medicare Valid to"
                },
                {
                    "Alias": "kyc.driverLicense.firstName",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Driver's license Given Name/s"
                },
                {
                    "Alias": "kyc.driverLicense.lastName",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Driver's license Surname Name"
                },
                {
                    "Alias": "kyc.driverLicense.number",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Australian driver's license number"
                },
                {
                    "Alias": "kyc.driverLicense.state",
                    "Pages": [
                        "16"
                    ],
                    "Text": "State of issue"
                },
                {
                    "Alias": "kyc.driverLicense.expiryDate",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Expiry date"
                },
                {
                    "Alias": "kyc.driverLicense.cardNumber",
                    "Pages": [
                        "16"
                    ],
                    "Text": "Driver's license Card number"
                },
                {
                    "Alias": "investment.defaultAllocation",
                    "Pages": [
                        "6"
                    ],
                    "Text": 'Is "Please invest my account in the same way as my Vanguard Super SaveSmart account is invested" ticked'
                },
                {
                    "Alias": "investment.growth",
                    "Pages": [
                        "6"
                    ],
                    "Text": 'Investment options Growth'
                },
                {
                    "Alias": "investment.balance",
                    "Pages": [
                        "6"
                    ],
                    "Text": 'Investment options Balance'
                }
            ]
        }
    },
    "unknown": {
        "QueriesConfig": {
            "Queries": [
                {
                    "Alias": "person_first_name",
                    "Pages": [
                        "*"
                    ],
                    "Text": "Person First name"
                },
                {
                    "Alias": "person_last_name",
                    "Pages": [
                        "*"
                    ],
                    "Text": "Person Surname"
                },
                {
                    "Alias": "account_number",
                    "Pages": [
                        "*"
                    ],
                    "Text": "Account number"
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
                    "Version": ADAPTER_VERSION
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
    const fileName = message.DocumentLocation.S3ObjectName.replace("upload/", "")
    console.log(JSON.stringify(event))
    const params = {
        Bucket: "hackathon-textract-results",
        Key: `type/${message.JobId}/1`
    };
    console.log(params)

    const resultMap = await readTextractResult(s3Client, "hackathon-textract-results", "type", message.JobId)
    console.log(resultMap)

    var result = resultMap?.find((b: any) => b.key == "form_name");
    var queryResponse = await findFileRecord(dynamoDbClient, fileName)
    const dynamoItem = queryResponse.Items![0];

    // lowercase value and replace spaces with _
    var formKey: string = result?.value.toLowerCase()
        .replace(/,/g, "")
        .replace(/ /g, "_");
    dynamoItem.form_type = { S: formKey };


    var formKey = formQuestions[formKey] ? formKey : "unknown"
    console.log(formKey)

    await saveDocument(dynamoDbClient, dynamoItem);

    return await startDocumentAnalysis(message.DocumentLocation.S3Bucket,
        message.DocumentLocation.S3ObjectName, formQuestions[formKey])
}