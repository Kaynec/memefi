import { appendHeaders } from "@/server/helper";
import fs from "fs";
async function getCampaignLists(token: string) {
  const rawBody = [
    {
      operationName: "CampaignLists",
      variables: {},
      query:
        "fragment FragmentCampaign on CampaignOutput {  id  type  status  backgroundImageUrl  campaignUserParticipationId  completedTotalTasksAmount  description  endDate  iconUrl  isStarted  name  completionReward {    spinEnergyReward    coinsReward    claimedAt    id    __typename  }  totalRewardsPool  totalTasksAmount  collectedRewardsAmount  penaltyAmount  penaltySpinEnergyAmount  collectedSpinEnergyRewardsAmount  totalSpinEnergyRewardsPool  __typename}query CampaignLists {  campaignLists {    special {      ...FragmentCampaign      __typename    }    normal {      ...FragmentCampaign      __typename    }    archivedCount    __typename  }}",
    },
  ];

  var requestOptions = {
    headers: appendHeaders(token),
    body: rawBody,
    method: "post" as "post",
  };

  return new Promise((res, rej) => {
    $fetch("https://api-gw-tg.memefi.club/graphql", requestOptions)
      .then((data: any) => {
        return res(data?.[0].data.campaignLists.normal);
      })
      .catch((e) => rej(e));
  });
}

async function fetchTasksList(campaignId: number, token: string) {
  const url = "https://api-gw-tg.memefi.club/graphql";
  const query = `
    fragment FragmentCampaignTask on CampaignTaskOutput {
      id
      name
      description
      status
      type
      position
      buttonText
      coinsRewardAmount
      spinEnergyRewardAmount
      link
      userTaskId
      isRequired
      iconUrl
      taskVerificationType
      verificationAvailableAt
      shouldUseVpn
      isLinkInternal
      quiz {
        id
        question
        answers
        __typename
      }
      __typename
    }

    query GetTasksList($campaignId: String!) {
      campaignTasks(campaignConfigId: $campaignId) {
        ...FragmentCampaignTask
        __typename
      }
    }
  `;

  const variables = {
    campaignId,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: appendHeaders(token),
      body: JSON.stringify([
        {
          operationName: "GetTasksList",
          variables: variables,
          query: query,
        },
      ]),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data[0].data.campaignTasks;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

export default defineEventHandler(async (event) => {
  const token = event.node.req.headers.authorization as string;
  if (!token) {
    return {
      data: "NO TOKEN",
    };
  }

  const campaignLists = (await getCampaignLists(token)) as any[];
  const campaignTasks = [];
  for (let compaign of campaignLists) {
    try {
      campaignTasks.push(...(await fetchTasksList(compaign.id, token)));
      console.log("DOING");
    } catch (error) {
      console.warn(error);
    }
  }
  return {
    data: campaignTasks,
  };
});
