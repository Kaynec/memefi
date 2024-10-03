import { appendHeaders } from "@/server/helper";
import fs from "fs";

async function fetchTaskUserId(taskId: number, token: string) {
  const body = JSON.stringify([
    {
      operationName: "GetTaskById",
      variables: { taskId },
      query: `
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
                query GetTaskById($taskId: String!) {
                  campaignTaskGetConfig(taskId: $taskId) {
                    ...FragmentCampaignTask
                    __typename
                  }
                }
              `,
    },
  ]);
  return new Promise((res, rej) => {
    $fetch("https://api-gw-tg.memefi.club/graphql", {
      method: "POST",
      headers: appendHeaders(token),
      body: body,
    })
      .then((data) => {
        res(data);
      })
      .catch((error) => {
        rej(error);
      });
  });
}

function startTask(taskId: number, token: string) {
  return new Promise((resolve, reject) => {
    $fetch("https://api-gw-tg.memefi.club/graphql", {
      headers: appendHeaders(token),
      method: "POST",
      body: JSON.stringify([
        {
          operationName: "CampaignTaskToVerification",
          variables: {
            taskConfigId: taskId,
          },
          query: `
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
  
              mutation CampaignTaskToVerification($taskConfigId: String!) {
                campaignTaskMoveToVerificationV2(taskConfigId: $taskConfigId) {
                  ...FragmentCampaignTask
                  __typename
                }
              }
            `,
        },
      ]),
    })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function finishTask(taskId: number, token: string) {
  const body = JSON.stringify([
    {
      operationName: "CampaignTaskMarkAsCompleted",
      variables: {
        userTaskId: taskId,
      },
      query: `
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
  
            mutation CampaignTaskMarkAsCompleted($userTaskId: String!, $verificationCode: String, $quizAnswers: [CampaignTaskQuizQuestionInput!]) {
              campaignTaskMarkAsCompleted(
                userTaskId: $userTaskId
                verificationCode: $verificationCode
                quizAnswers: $quizAnswers
              ) {
                ...FragmentCampaignTask
                __typename
              }
            }
          `,
    },
  ]);

  return new Promise((resolve, reject) => {
    $fetch("https://api-gw-tg.memefi.club/graphql", {
      method: "post",
      headers: appendHeaders(token),
      body: body,
    })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export default defineEventHandler(async (event) => {
  const token = event.node.req.headers.authorization as string;
  if (event.node.req.method !== "POST") {
    return "Wrong Method";
  }
  if (!token) {
    return "NO TOKEN";
  }

  const campaignTasks = await readBody(event);

  for (let task of campaignTasks) {
    try {
      const fetchedTask = await startTask(task.id, token);
      console.log("doing", (fetchedTask as any)[0]);
    } catch (error) {
      console.warn(error);
    }
  }
  console.log("STEP 2 done");

  const newTasks: any[] = [];
  for (let task of campaignTasks) {
    try {
      const fetchedTask = await fetchTaskUserId(task.id, token);
      newTasks.push((fetchedTask as any)[0]?.data);
      console.log("doing", (fetchedTask as any)[0]);
    } catch (error) {
      console.warn(error);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 120000));

  const newNewTasks = [];
  for (let task of newTasks) {
    try {
      const fetchedTask = await finishTask(
        task.campaignTaskGetConfig.userTaskId,
        token
      );
      newNewTasks.push(fetchedTask);
      console.log("doing", (fetchedTask as any)[0]);
    } catch (error) {}
  }
  return "Earning Done Bro Good Job";
});
