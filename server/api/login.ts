import { appendHeaders } from "../helper";
function parseURL(url: string): URLSearchParams {
  // Extract the part after '#' in the URL
  let paramsString = new URLSearchParams(
    decodeURIComponent(
      decodeURIComponent(decodeURIComponent(url.split("#tgWebAppData=")[1]))
    )
  );
  return paramsString;
}

function buildRequestBody(params: URLSearchParams) {
  // Construct the dynamic body based on parsed URL parameters
  let body = [
    {
      operationName: "MutationTelegramUserLogin",
      variables: {
        webAppData: {
          auth_date: parseInt(params.get("auth_date")!),
          hash: params.get("hash"),
          query_id: params.get("query_id"),
          checkDataString: `auth_date=${params.get(
            "auth_date"
          )}\nquery_id=${params.get("query_id")}\nuser=${params.get("user")}`,
          user: JSON.parse(params.get("user")!),
        },
      },
      query: `
        mutation MutationTelegramUserLogin($webAppData: TelegramWebAppDataInput!, $referralCode: String) {
          telegramUserLogin(webAppData: $webAppData, referralCode: $referralCode) {
            access_token
            __typename
          }
        }`,
    },
  ];

  return JSON.stringify(body);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const url = body.data;
  // Parsing the URL
  let params = parseURL(url);

  // Building the dynamic request body
  let requestBody = buildRequestBody(params);
  try {
    const data = (await $fetch("https://api-gw-tg.memefi.club/graphql", {
      headers: appendHeaders(),
      referrer: "https://tg-app.memefi.club/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: requestBody,
      method: "POST",
    })) as any;

    return {
      data: data?.[0].data.telegramUserLogin?.access_token as string,
      status: 200,
    };
  } catch (error) {
    return {
      status: 400,
      data: error,
    };
  }
});
