import { convertMapToObject, readTextractResult } from "../common/textract.helper";
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
          key: 'person.residentialAddress.state',
          value: '',
          query: 'Person State',
          confidence: undefined
        },
        {
          key: 'person.gender',
          value: 'Female',
          query: 'Person Gender',
          confidence: 100
        },
        {
          key: 'person.middleName',
          value: '',
          query: 'Person Middle name',
          confidence: undefined
        },
        {
          key: 'person.firstName',
          value: 'Yeva',
          query: 'Person First name',
          confidence: 100
        },
        {
          key: 'person.email',
          value: 'yeva@gmailcon',
          query: 'Person Email address',
          confidence: 95
        },
        {
          key: 'person.residentialAddress.suburb',
          value: '',
          query: 'Person Suburb',
          confidence: undefined
        },
        {
          key: 'person.residentialAddress.postCode',
          value: '3150',
          query: 'Person Postcode',
          confidence: 68
        },
        {
          key: 'person.vanguardId',
          value: '12345098765',
          query: 'Person Vanguard Super member number',
          confidence: 98
        },
        {
          key: 'person.lastName',
          value: 'Bilyahcat',
          query: 'Person Surname',
          confidence: 99
        },
        {
          key: 'person.residentialAddress.addressOne',
          value: '123 Hunter st',
          query: 'Person Australian residential address',
          confidence: 98
        },
        {
          key: 'person.dateOfBirth',
          value: '19 / 03 / 1980',
          query: 'Person Date of birth',
          confidence: 98
        },
        {
          key: 'person.phoneNumber',
          value: '0459999991',
          query: 'Person Mobile',
          confidence: 96
        }
      ]
    var obj = convertMapToObject(<any>test);
});
