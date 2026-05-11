// 회사 코드 검증 API.
// 현재는 mock 구현. 백엔드가 준비되면 verifyCompanyCode 본문만 fetch 호출로 교체하면 됨.
// 호출부(Login.jsx)는 반환 형태({ companyCode, companyName })와 AuthError 규약만 알면 되므로
// 백엔드 전환 시 컴포넌트는 손대지 않아도 됩니다.

const MOCK_COMPANIES = {
  knu22: { companyCode: 'knu22', companyName: '경북대 22번 공장' },
};

const MOCK_LATENCY_MS = 400;

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export async function verifyCompanyCode(rawCode) {
  const code = (rawCode ?? '').trim();
  if (!code) {
    throw new AuthError('EMPTY_CODE', '회사 코드를 입력해주세요.');
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const company = MOCK_COMPANIES[code];
  if (!company) {
    throw new AuthError('COMPANY_NOT_FOUND', '존재하지 않는 회사 코드입니다.');
  }
  return company;
}

// 백엔드 연동 시 위 verifyCompanyCode 를 아래 형태로 교체하세요.
//
// export async function verifyCompanyCode(rawCode) {
//   const code = (rawCode ?? '').trim();
//   if (!code) throw new AuthError('EMPTY_CODE', '회사 코드를 입력해주세요.');
//
//   let res;
//   try {
//     res = await fetch('/api/auth/verify-company', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ companyCode: code }),
//     });
//   } catch {
//     throw new AuthError('NETWORK', '네트워크 오류가 발생했습니다.');
//   }
//
//   if (res.status === 404) {
//     throw new AuthError('COMPANY_NOT_FOUND', '존재하지 않는 회사 코드입니다.');
//   }
//   if (!res.ok) {
//     throw new AuthError('SERVER', '일시적인 오류가 발생했습니다.');
//   }
//   return res.json(); // { companyCode, companyName }
// }
