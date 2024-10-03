<template>
  <main class="main-container">
    <form @submit.prevent="onSubmit">
      <div>
        <input
          type="text"
          v-model="urlValue"
          placeholder="place your url here"
        />
      </div>

      <button type="button" style="width: 100%" @click="login">Login</button>
      <button type="button" style="width: 100%" @click="fetchCampaignLists">
        Fetch tasks
      </button>
      <button type="submit" style="width: 100%" @click="earnPoints">
        earn task points
      </button>
      <button type="submit" style="width: 100%" @click="doBoth">
        do both jobs for me habibi
      </button>
    </form>
  </main>
</template>
<script setup lang="ts">
import "@/styles.css";
import "@/pico.css";

const urlValue = ref("");

const token = useCookie<string>("token");
const campaignTasks = ref<any[]>([]);

async function onSubmit() {
  if (!token.value) {
    alert("Please enter your token");
    return;
  }
}

async function login() {
  try {
    const data = await $fetch("/api/login", {
      method: "post",
      body: {
        data: urlValue.value,
      },
    });
    if (data.status == 200) {
      alert("login successful");
      token.value = data.data;
    }
  } catch (error) {
    console.warn(error);
  }
}

async function fetchCampaignLists() {
  const result = window.confirm(
    "This process will take about 5 minutes, are you sure?"
  );

  if (!result) {
    alert("ok returning bruh");
    return;
  }
  try {
    const campaignLists = await $fetch("/api/campaign/lists", {
      headers: {
        authorization: token.value,
      },
    });

    if (typeof campaignLists.data == "string") {
      alert("wrong happend xd boiii");
      return;
    }
    campaignTasks.value = campaignLists.data as any[];
    localStorage.setItem("campaignTasks", JSON.stringify(campaignTasks.value));
  } catch (error) {}

  alert("FETCHING DONE");
}

async function earnPoints() {
  const result = window.confirm(
    "This process will take about 10 minutes, are you sure?"
  );

  if (!result) {
    alert("ok returning bruh");
    return;
  }
  const tasks = localStorage.getItem("campaignTasks");
  if (!tasks) {
    alert("no tasks");
    return;
  }

  alert("earning points");
  try {
    const earning = await $fetch("/api/campaign/earning", {
      headers: {
        authorization: token.value,
      },
      method: "post",
      body: tasks,
    });
    alert(`EARNING DONE , ${earning}`);
  } catch (error) {
    alert("EARNING PROBLEM XD");
  }
}

async function doBoth() {
  const result = window.confirm(
    "This process will take about 30 minutes, are you sure?"
  );

  if (!result) {
    alert("ok returning bruh");
    return;
  }

  if (!token.value) {
    alert("no token");
    return;
  }

  try {
    const tasks = await $fetch("/api/campaign/lists", {
      headers: {
        authorization: token.value,
      },
    });

    if (typeof tasks.data == "string") {
      alert("wrong happend xd boiii");
      return;
    }

    const earning = await $fetch("/api/campaign/earning", {
      headers: {
        authorization: token.value,
      },
      method: "post",
      body: tasks.data,
    });
    alert(`EARNING DONE , ${earning}`);
  } catch (error) {
    alert("EARNING PROBLEM XD");
  }
}
</script>
