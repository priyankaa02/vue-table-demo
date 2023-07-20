<template>
  <div v-if="!isLoading" class="overflow-auto flex flex-col justify-center">
    <div class="flex items-center gap-x-2 mb-4">
      <label for="editionFilter">Filter by Edition:</label>
      <select
        id="editionFilter"
        v-model="selectedEdition"
        class="border rounded px-4 py-2"
      >
        <option value="">All Editions</option>
        <option
          v-for="edition in allEditions"
          :key="edition.id"
          :value="edition.id"
        >
          {{ edition.name }}
        </option>
      </select>
    </div>
    <table class="w-full text-left divide-y divide-gray-200 mobile:text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th @click="sort('name')" class="cursor-pointer">
            Name
            <span v-if="sortColumn === 'name'">
              <i v-if="sortOrder === 'asc'" class="ml-1 fas fa-chevron-up"></i>
              <i v-else class="ml-1 fas fa-chevron-down"></i>
            </span>
          </th>
          <th @click="sort('description')" class="cursor-pointer">
            Description
            <span v-if="sortColumn === 'description'">
              <i v-if="sortOrder === 'asc'" class="ml-1 fas fa-chevron-up"></i>
              <i v-else class="ml-1 fas fa-chevron-down"></i>
            </span>
          </th>
          <th @click="sort('edition')" class="cursor-pointer">
            Edition(s)
            <i v-if="sortColumn === 'edition'" :class="sortEditionIcon"></i>
          </th>
          <th @click="sort('timeOfCapture')" class="cursor-pointer">
            Time of Screenshot
            <i v-if="sortColumn === 'timeOfCapture'" :class="sortTimeIcon"></i>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="feature in filteredData" :key="feature.id">
          <td>{{ feature.name }}</td>
          <td class="max-w-sm whitespace-wrap">{{ feature.description }}</td>
          <td>
            <ul>
              <li v-for="edition in featureEditions(feature)" :key="edition.id">
                {{ edition.name }}
              </li>
            </ul>
          </td>
          <td>{{ getFormattedDate(feature) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";

interface Edition {
  id: string;
  name: string;
  description: string;
}

interface Screenshot {
  status: string;
  mode: string;
  timeOfCapture: string | null;
  filekeyRaw: string | null;
  filekeyStyled: string | null;
  filesize: number | null;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  screenshots: {
    items: Screenshot[];
  };
  FeatureEditions: {
    items: {
      edition: Edition;
    }[];
  };
}

const data = ref<Feature[]>([]);
const isLoading = ref(true);
const selectedEdition = ref<string>("");
const sortColumn = ref("name");
const sortOrder = ref("");
const editionsSortOrder = ref("");
const timeOfCaptureSortOrder = ref("");

const fetchData = async () => {
  try {
    const response = await axios.get<{
      items: Feature[];
    }>("https://content.launchbrightly.com/lbdemo/baremetrics.json");
    data.value = response.data.features.items;
  } catch (error) {
    console.error(error);
  }
};

onMounted(fetchData);

const sort = (column: string) => {
  if (column === sortColumn.value) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortOrder.value = "asc";
  }

  // Handle sorting for Edition(s) column separately
  if (column === "edition") {
    editionsSortOrder.value =
      editionsSortOrder.value === "asc" ? "desc" : "asc";
  }

  if (column === "timeOfCapture") {
    timeOfCaptureSortOrder.value =
      timeOfCaptureSortOrder.value === "asc" ? "desc" : "asc";
  }

  if (data.value && data.value.length > 0) {
    data.value.sort((a, b) => {
      if (column === "edition") {
        // Special handling for Edition(s) column
        const editionsA = featureEditions(a).map((edition) => edition.name);
        const editionsB = featureEditions(b).map((edition) => edition.name);

        const sortValueA = editionsA.join(", ");
        const sortValueB = editionsB.join(", ");

        if (sortValueA < sortValueB)
          return editionsSortOrder.value === "asc" ? -1 : 1;
        if (sortValueA > sortValueB)
          return editionsSortOrder.value === "asc" ? 1 : -1;
        return 0;
      } else if (column === "timeOfCapture") {
        // Special handling for Time of Screenshot column
        const screenshotA = a.screenshots.items[0];
        const screenshotB = b.screenshots.items[0];

        const timeA = screenshotA
          ? new Date(screenshotA.timeOfCapture).getTime()
          : 0;
        const timeB = screenshotB
          ? new Date(screenshotB.timeOfCapture).getTime()
          : 0;

        if (timeA < timeB)
          return timeOfCaptureSortOrder.value === "asc" ? -1 : 1;
        if (timeA > timeB)
          return timeOfCaptureSortOrder.value === "asc" ? 1 : -1;
        return 0;
      } else {
        // General handling for other columns
        const sortValueA = a[column];
        const sortValueB = b[column];

        if (sortValueA < sortValueB) return sortOrder.value === "asc" ? -1 : 1;
        if (sortValueA > sortValueB) return sortOrder.value === "asc" ? 1 : -1;
        return 0;
      }
    });
  }
};

// Watch for changes in data
watch(data, () => {
  isLoading.value = false;
  sort(sortColumn.value);
});

const featureEditions = (feature: Feature) => {
  return feature?.FeatureEditions?.items?.map((item) => item.edition) || [];
};

const getFormattedDate = (feature: Feature) => {
  const screenshot = feature?.screenshots?.items?.[0];
  if (screenshot && screenshot.timeOfCapture) {
    const date = new Date(screenshot.timeOfCapture);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }
  return "";
};

// Computed property to display the sorting icon in the table header for Edition(s) column
const sortEditionIcon = computed(() => {
  return editionsSortOrder.value === "asc"
    ? "fas fa-chevron-up"
    : "fas fa-chevron-down";
});

// Computed property to display the sorting icon in the table header for Time of Screenshot column
const sortTimeIcon = computed(() => {
  return timeOfCaptureSortOrder.value === "asc"
    ? "fas fa-chevron-up"
    : "fas fa-chevron-down";
});

// Create a computed property to get all editions for the filter dropdown
const allEditions = computed(() => {
  const editions: Edition[] = [];
  data.value.forEach((feature) => {
    feature.FeatureEditions.items.forEach((item) => {
      if (!editions.find((edition) => edition.id === item.edition.id)) {
        editions.push(item.edition);
      }
    });
  });
  return editions;
});

// Create a computed property to get filtered data based on selected edition
const filteredData = computed(() => {
  if (!selectedEdition.value) {
    return data.value;
  }
  return data.value.filter((feature) => {
    return feature.FeatureEditions.items.some(
      (item) => item.edition.id === selectedEdition.value
    );
  });
});
</script>

<style>
@import "@/../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
</style>
