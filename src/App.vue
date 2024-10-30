<script setup lang="ts">
import Panel from "primevue/panel";
import Papa from "papaparse";
import Select from "primevue/select";
import * as dfd from "danfojs/dist/danfojs-browser/src";
import random from "random";
import { toRaw, ref, reactive, watch } from "vue";
import { PrimeIcons } from "@primevue/core/api";
const preSelectRooms = ref(false);
const navItems = ref([
    {
        label: "Github",
        icon: PrimeIcons.GITHUB,
        url: "https://github.com/DeadPumpkin43",
    },
    { label: "Clear", icon: PrimeIcons.ERASER, command: onClear },
]);
function maxIndices(arr: number[]) {
    if (arr.length === 0) {
        return [];
    }

    const maxValue = Math.max(...arr);
    return arr.reduce((indices, value, index) => {
        if (value === maxValue) {
            indices.push(index);
        }
        return indices;
    }, []);
}
var PopupVisible = ref(false);
var colOps = ref([]);
var firstChoice = ref();
var lastChoice = ref();
var colSplitOps = ref();
var peoplePerRoom = ref(Number(localStorage.getItem("peoplePerRoom")));
var ParseRes;
var preChosenCols = reactive({value:[]});
interface panelOptions {
    name: string;
    id: number;
    options: { name: string; id: number }[];
    refOptions: ref;
}
var panelDisplay =
    localStorage.getItem("panelDisplay") != null
        ? ref<panelOptions[]>(JSON.parse(localStorage.getItem("panelDisplay")))
        : ref<panelOptions[]>([]);
function onClear() {
    Object.assign(values, []);
    panelDisplay.value = [];

    console.log(panelDisplay);
}
function onSave() {}
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

var personArray =
    localStorage.getItem("personArray") != null
        ? reactive(JSON.parse(localStorage.getItem("personArray")))
        : reactive([]);
const values =
    localStorage.getItem("values") != null
        ? reactive(JSON.parse(localStorage.getItem("values")))
        : reactive({});
function onSubmit() {
    var finalRooms = [];
    var dataArray = personArray.map((e) => {
        var returnArr = [e.name, e.id];
        console.log(toRaw(values[e.id]));
        returnArr = returnArr.concat(
            Object.entries(toRaw(values[e.id])).map((a) => {
                console.log(a[1]);
                return a[1] != null ? a[1] : null;
            }),
        );

        return returnArr;
    });
    var columnLabels = ["Name", "Index"];
    columnLabels = columnLabels.concat(
        Array.from({ length: peoplePerRoom.value + 1 }, (_, i) => i + 1),
    );
    console.log(columnLabels);
    console.log(dataArray);
    var peopleTable = new dfd.DataFrame(dataArray, {
        columns: columnLabels,
        config: {
            tableMaxRow: 100,
        },
    });
    peopleTable.print();
    var tempTableArr: dfd.DataFrame[] = [];
    if (personArray[0]["split"] != null) {
        var uniqueSplits = [...new Set(personArray.map((a) => a.split))];
        uniqueSplits.forEach((split) => {
            var affectedIds = personArray
                .filter((a) => a.split == split)
                .map((a) => a.id);
            var newTable = peopleTable.loc({
                rows: affectedIds,
            });
            newTable.resetIndex({
                inplace: true,
            });
            tempTableArr.push(newTable);
        });
    } else {
        tempTableArr.push(peopleTable.copy());
    }
    tempTableArr.forEach((tempTable) => {
        var roomAmount = Math.ceil(tempTable.shape[0] / peoplePerRoom.value);
        var choiceCols = Array.from(
            { length: peoplePerRoom.value + 1 },
            (_, i) => i + 1,
        );

        var rooms = [];
        console.log(roomAmount);
        for (var i = 0; i < roomAmount; i++) {
            var chosenPerson = random.int(0, tempTable.shape[0] - 1);

            var peopleIndex = tempTable["Index"].values;
            var chosenIndex = peopleIndex[chosenPerson];
            var chosenPersonsChoices = tempTable.loc({
                rows: [chosenPerson],
                columns: choiceCols,
            }).values[0];
            console.log(chosenPersonsChoices);
            var doubleSelected = [];
            chosenPersonsChoices.forEach((choice) => {
                var choiceTempIndex = peopleIndex.findIndex((a) => a == choice);
                if (choiceTempIndex == -1) {
                    return;
                }
                if (
                    tempTable
                        .loc({ rows: [choiceTempIndex], columns: choiceCols })
                        .values[0].includes(chosenIndex)
                ) {
                    doubleSelected.push(choiceTempIndex);
                }
            });
            if (doubleSelected.length <= 0) {
                i--;
                continue;
            }
            var countInCommon = [];

            doubleSelected.forEach((person) => {
                var othersSelection = tempTable.loc({
                    rows: [person],
                    columns: choiceCols,
                }).values[0];
                var inComm = 0;
                othersSelection.forEach((choice) => {
                    inComm += chosenPersonsChoices.includes(choice) ? 1 : 0;
                });
                countInCommon.push(inComm);
            });

            var pairCanidates = maxIndices(countInCommon);
            console.log(
                `doubleSelected:${doubleSelected}, pairCanidate:${pairCanidates},choices:${chosenPerson}`,
            );
            if (pairCanidates.length > 1) {
                pairCanidates =
                    pairCanidates[random.int(0, pairCanidates.length - 1)];
            } else {
                pairCanidates = pairCanidates[0];
            }
            var pairMate = peopleIndex[doubleSelected[pairCanidates]];
            tempTable.drop({
                index: [chosenPerson, doubleSelected[pairCanidates]],
                inplace: true,
            });
            tempTable.print();
            if (tempTable.shape[0] > 0) {
                tempTable.resetIndex({
                    inplace: true,
                });
            }

            rooms.push([chosenIndex, pairMate]);
            console.log([chosenIndex, pairMate]);
        }
        console.log(rooms);
        while (tempTable.shape[0] > 0) {
            var index = tempTable["Index"].values;
            var peopleUsed = Array.from(
                { length: Math.min(tempTable.shape[0], rooms.length) },
                (_, i) => i,
            ).map((a) => {
                return index[a];
            });
            var partnerArray = [];

            peopleUsed.forEach((person1) => {
                var valArray = [];
                console.log(`Person1:${person1}`);
                rooms.forEach((people2) => {
                    var value = 0;
                    people2.forEach((person2) => {
                        value += peopleTable
                            .loc({
                                rows: [person2],
                                columns: choiceCols,
                            })
                            .values[0].includes(person1)
                            ? 1
                            : 0;
                        value += peopleTable
                            .loc({
                                rows: [person1],
                                columns: choiceCols,
                            })
                            .values[0].includes(person2)
                            ? 0.5
                            : 0;
                    });
                    valArray.push(value);
                });
                partnerArray.push(valArray);
            });
            var partnerFrame = new dfd.DataFrame(partnerArray, {
                index: peopleUsed,
                columns: rooms,
            });
            peopleUsed.forEach((person) => {
                tempTable.print();
                partnerFrame.print();
                var values = partnerFrame.loc({
                    rows: [person],
                }).values[0];
                var potentialCanidates = maxIndices(values);
                if (potentialCanidates.length > 1) {
                    potentialCanidates =
                        potentialCanidates[
                            random.int(0, potentialCanidates.length - 1)
                        ];
                } else {
                    potentialCanidates = potentialCanidates[0];
                }
                console.log(potentialCanidates);
                var actualRoomIndex = rooms.indexOf(
                    partnerFrame.columns[potentialCanidates],
                );
                partnerFrame.drop({
                    inplace: true,
                    index: [person],
                });
                partnerFrame.drop({
                    inplace: true,
                    columns: [partnerFrame.columns[potentialCanidates]],
                });
                tempTable.drop({
                    inplace: true,
                    index: [index.indexOf(person)],
                });

                rooms[actualRoomIndex].push(person);
                console.log(rooms[actualRoomIndex]);
            });
        }

        finalRooms = finalRooms.concat(rooms);
    });
    console.log(finalRooms);
    var download = URL.createObjectURL(
        new Blob(
            [
                [
                    "Results:\n",
                    finalRooms
                        .map((a) => {
                            return a
                                .map((b) => {
                                    return peopleTable["Name"].values[b];
                                })
                                .join(", ");
                        })
                        .join("\n"),
                ].join(""),
            ],
            { type: "text-plain" },
        ),
    );
    const dlLink = document.createElement("a");
    dlLink.href = download;
    dlLink.download = "results.txt";
    dlLink.click();
    URL.revokeObjectURL(download);
    console.log("done");
}
function startChooser() {
    Object.assign(values, {});
    personArray.splice(0, personArray.length);
    console.log(`Array${personArray}`);
    onClear();
    if (
        firstChoice.value != null &&
        peoplePerRoom.value != null &&
        !(peoplePerRoom.value < 2)
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
        });
        ParseRes.data.forEach((e: any, i: number) => {
            values[i] = {};
            Array.from(
                { length: peoplePerRoom.value + 1 },
                (_, i) => i + 1,
            ).forEach((a) => {
                if(!preSelectRooms.value){
                    values[i][a] = null;
                    return;
                }
                if(preChosenCols[i][a] == null){
                    values[i][a] = null;
                }
                
            });
        });
        console.log(values);
        console.log(personArray);
        panelDisplay.value = [];
        toRaw(personArray).forEach((e) => {
            var newPanel: panelOptions = {};
            newPanel.name = e.name;
            newPanel.id = e.id;
            newPanel.refOptions = values[newPanel.id];
            var newPersonArray = structuredClone(toRaw(personArray)).filter(
                (a) => {
                    if (newPanel.id == a.id) {
                        return false;
                    }
                    if (a.split == null) {
                        return true;
                    }
                    if (a.split != e.split) {
                        return false;
                    }
                    return true;
                },
            );
            newPersonArray = newPersonArray.map((a) => {
                return { name: a.name, id: a.id };
            });
            newPersonArray.unshift({ name: "None", id: null });
            newPanel.options = newPersonArray;
            panelDisplay.value.push(newPanel);
        });
    }
}
console.log(personArray);
watch(panelDisplay, (state) => {
    localStorage.setItem("panelDisplay", JSON.stringify(state));
});
watch(personArray, (state) => {
    localStorage.setItem("personArray", JSON.stringify(state));
});
watch(peoplePerRoom, (state) => {
    localStorage.setItem("peoplePerRoom", peoplePerRoom.value);
    preChosenCols.value = new Array(peoplePerRoom.value + 1).fill(null);
});
watch(values, (state) => {
    localStorage.setItem("values", JSON.stringify(state));
});
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
        <Select
            v-model="lastChoice"
            :options="colOps"
            placeholder="Last Names"
        />
        <Select
            v-model="colSplitOps"
            :options="colOps"
            placeholder="Column to Seperate Rooms"
        />
        <InputNumber
            v-model="peoplePerRoom"
            :invalid="peoplePerRoom === null"
            showButtons
            :min="2"
            placeholder="People Per Room*"
        />

        <div><Checkbox v-model="preSelectRooms" binary></Checkbox><label>Rooms Already Chosen</label></div>
        <Panel v-if="preSelectRooms" header="Columns for Choices">
            <Select v-for="(c,i) in preChosenCols.value" :options="colOps" v-model="preChosenCols.value[i]" :placeholder="`Choice ${i+1}`">

                
            </Select>
        </Panel>
        <Button label="Start " @click="startChooser" />
    </Dialog>
    <Panel v-for="panel in panelDisplay" :header="panel.name">
        <Select
            v-for="(ee, i) in panel.refOptions"
            v-model="values[panel.id][i]"
            placeholder="Select One"
            :options="panel.options"
            optionLabel="name"
            optionValue="id"
        />
    </Panel>
    <Button label="Submit" v-if="panelDisplay.length > 0" @click="onSubmit" />
</template>
