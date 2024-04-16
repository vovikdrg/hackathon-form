import { calculateMean, calculateStdDev, convertMapToObject, readTextractResult } from "../common/textract.helper";
import { readFileSync } from 'fs';

test('Test common textract', async () => {
    const mockS3 = {
        send: jest.fn()
    }
    // return json file when calling s3
    mockS3.send.mockResolvedValueOnce({
        Body: {
            transformToString: jest.fn().mockResolvedValue(readFileSync('./test/test-data/extracted-details.json').toString())
        }
    });
    var result = await readTextractResult(<any>mockS3, "any", "any", "1");

    var test = [
      {
        key: 'person.middleName',
        value: '',
        query: 'Person Middle name',
        confidence: undefined
      },
      {
        key: 'person.firstName',
        value: 'QUANG',
        query: 'Person First name',
        confidence: 99
      },
      {
        key: 'person.email',
        value: 'quang@gmail.com',
        query: 'Person Email address',
        confidence: 81
      },
      {
        key: 'person.vanguardId',
        value: '',
        query: 'Person Vanguard Super member number',
        confidence: undefined
      },
      {
        key: 'person.lastName',
        value: 'NGUYEN',
        query: 'Person Surname',
        confidence: 99
      },
      {
        key: 'person.residentialAddress.suburb',
        value: 'MELBOURNE',
        query: 'Person Suburb*',
        confidence: 99
      },
      {
        key: 'person.dateOfBirth',
        value: '/ 01 / 1990',
        query: 'Person Date of birth',
        confidence: 92
      },
      {
        key: 'person.phoneNumber',
        value: '0400000000',
        query: 'Person Mobile',
        confidence: 95
      },
      {
        key: 'person.residentialAddress.postCode',
        value: '3000',
        query: 'Person Postcode*',
        confidence: 99
      },
      {
        key: 'person.gender',
        value: 'Male',
        query: 'Person Gender',
        confidence: 100
      },
      {
        key: 'person.residentialAddress.addressOne',
        value: '130 LONSDALE ST',
        query: 'Person Australian residential address',
        confidence: 99
      },
      {
        key: 'person.residentialAddress.state',
        value: 'VIC',
        query: 'Person State*',
        confidence: 99
      },
      {
        key: 'person.sourceOfFunds',
        value: 'Salary',
        query: 'Person Source of funds',
        confidence: 89
      },
      {
        key: 'person.occupation',
        value: 'D O C T O R',
        query: 'Occupation (if you have already retired, please provide your most recent occupation before retiring)*',
        confidence: 95
      },
      {
        key: 'account.type',
        value: 'Vanguard Super TransitionSmart account',
        query: 'Which Account to open',
        confidence: 99
      },
      {
        key: 'account.taxDeductions',
        value: '',
        query: 'Have you finalised any tax deductions you intend to claim for your personal super contributions',
        confidence: undefined
      },
      {
        key: 'account.whenToStart',
        value: 'Start my payments on the next standard payment date after my application is processed (default).',
        query: 'When would you like your pension payments to start',
        confidence: 58
      },
      {
        key: 'account.paymentFrequency',
        value: 'Fortnightly (default)',
        query: 'Payment frequency',
        confidence: 99
      },
      {
        key: 'account.bankAccountNumber',
        value: '1 2345678',
        query: 'Account number',
        confidence: 97
      },
      {
        key: 'account.bankStatementCopy',
        value: 'Yes',
        query: 'Is "I have attached a copy of a bank statement" ticked',
        confidence: 100
      },
      {
        key: 'account.bankName',
        value: 'C B A',
        query: 'Name of bank',
        confidence: 95
      },
      {
        key: 'account.bankBsb',
        value: '063000',
        query: 'BSB',
        confidence: 97
      }
    ]
    var obj = calculateStdDev(<any>test);
    console.log(obj)
});
