import axios from 'axios';
import config from '../config/config';

export const verifyBakongTransaction = async (md5: string) => {
  return await axios.post(
    'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5',
    { md5 },
    {
      headers: {
        Authorization: `Bearer ${config.bakong_token}`,
        'Content-Type': 'application/json',
      },
    },
  );
};
