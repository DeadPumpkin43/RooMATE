<script setup lang="ts">
import Panel from "primevue/panel";
import Papa from "papaparse";

import Select from "primevue/select";

import { ref, h, render } from "vue";
var alwaysTrue = ref(true);
import { PrimeIcons } from "@primevue/core/api";
const navItems = ref([
  {
    label: "Github",
    icon: PrimeIcons.GITHUB,
    url: "https://github.com/DeadPumpkin43",
  },
  { label: "Clear", icon: PrimeIcons.ERASER },
]);
var PopupVisible = ref(false);
var colOps = ref([]);
var firstChoice = ref();
var lastChoice = ref();
var colSplitOps = ref();
var peoplePerRoom = ref();
var ParseRes;
function onFileSelect(event) {
  const file = event.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    console.log(e.target.result);
    ParseRes = Papa.parse(e.target.result, {
      header: true,
    });
    firstChoice.value = null;
    lastChoice.value = null;
    peoplePerRoom.value = null;
    colSplitOps.value = null;
    console.log(ParseRes);
    colOps.value = ParseRes.meta.fields;
    PopupVisible.value = true;
  };

  reader.readAsText(file);
}
var firstContainer = document.createElement("div");
document.body.appendChild(firstContainer);
var personArray = [];
var values = {};
function startChooser() {
  personArray = [];
  if (
    firstChoice.value != null &&
    peoplePerRoom.value != null &&
    !(peoplePerRoom.value < 0)
  ) {
    PopupVisible.value = false;
    ParseRes.data.forEach((e: any, i: number) => {
      var fullName = `${e[firstChoice.value]}`;

      if (lastChoice.value != null) {
        fullName += ` ${e[lastChoice.value]}`;
      }
      var personData = {
        name: fullName,
        id: i,
      };
      if (colSplitOps.value != null) {
        personData["split"] = `${e[colSplitOps.value]}`;
      }
      personArray.push(personData);
      values[i] = {};
      Array.from({ length: peoplePerRoom.value + 1 }, (_, i) => i + 1).forEach(
        (a) => {
          values[i][a] = ref();
        }
      );
    });
    console.log(values);
    console.log(personArray);
    firstContainer.replaceChildren();
    personArray.forEach((e) => {
      var ct = document.createElement("div");
      firstContainer.appendChild(ct);
      render(
        h(
          Panel,
          {
            header: e.name,
          },
          Array.from({ length: peoplePerRoom.value + 1 }, (_, f) => f + 1).map(
            (b) => {
              console.log(
                personArray.map((c, x) => {
                  if (x != e.id) {
                    return { name: c, id: x };
                  }
                })
              );
              return h(Select, {
                value: values[e.id],
                options: personArray.map((c, x) => {
                  if (x != e.id) {
                    return { name: c, id: x };
                  }
                }),
                optionLabel: "name",
                optionValue: "id",
                placeholder: "choice",
              });
            }
          )
        ),
        ct
      );
    }, null);
  }
}
</script>

<template>
  <Menubar :model="navItems" breakpoint="640px">
    <template #start>
      <FileUpload
        mode="basic"
        name="demo[]"
        accept=".csv"
        @select="onFileSelect"
        :auto="true"
        chooseLabel="Upload Person Sheet"
        chooseIcon="pi pi-file-import"
        customUpload
      />
    </template>
  </Menubar>
  <img
    v-if="src"
    :src="src"
    alt="Image"
    class="shadow-md rounded-xl w-full sm:w-64"
    style="filter: grayscale(100%)"
  />
  <Dialog modal v-model:visible="PopupVisible" header="Configure Names">
    <Select
      v-model="firstChoice"
      :options="colOps"
      :invalid="firstChoice === null"
      placeholder="First Names *"
    />
    <Select v-model="lastChoice" :options="colOps" placeholder="Last Names" />
    <Select
      v-model="colSplitOps"
      :options="colOps"
      placeholder="Column to Seperate Rooms"
    />
    <InputNumber
      v-model="peoplePerRoom"
      :invalid="peoplePerRoom === null"
      showButtons
      :min="0"
      placeholder="People Per Room*"
    />
    <Button label="Start " @click="startChooser" />
  </Dialog>
</template>
