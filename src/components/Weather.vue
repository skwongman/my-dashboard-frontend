<template>
  <a-card title="香港天氣" class="mb-6 profile-card">
    <template #extra>
      <a-button
        type="text"
        :loading="loading"
        @click="refreshWeather"
        title="重新整理"
        class="!p-0 text-white"
      >
        <ReloadOutlined />
      </a-button>
    </template>
    <div>
      <div
        class="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 p-6 bg-white rounded-xl shadow border border-gray-100"
      >
        <div class="flex items-center gap-5">
          <img
            :src="iconUrl"
            alt="Weather Icon"
            class="w-16 h-16 rounded-full border border-gray-200 bg-white shadow-sm"
          />
          <div>
            <div class="flex items-end gap-2">
              <span class="text-3xl font-semibold"
                >{{ mainWeather.temperature
                }}<span class="text-3xl">°C</span></span
              >
            </div>
            <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>
                <span class="font-medium text-gray-700">濕度：</span>
                {{ mainWeather.humidity }}%
              </span>
              <span v-if="uvIndex.value.value !== ''">
                <span class="font-medium text-gray-700">紫外線指數：</span>
                {{ uvIndex.value }}
                <span>({{ uvIndex.desc }})</span>
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-xs text-gray-400">最後更新：</span>
          <span class="font-medium text-gray-600 text-sm">{{
            updateTime
          }}</span>
        </div>
      </div>

      <div v-if="warnings.length" class="mb-4">
        <a-alert
          v-for="(msg, idx) in warnings"
          :key="idx"
          type="warning"
          show-icon
          :message="msg"
          class="mb-2"
        />
      </div>

      <a-tabs>
        <a-tab-pane key="forecast" tab="九天天氣預報">
          <a-table
            :dataSource="forecastData"
            :columns="forecastColumns"
            rowKey="date"
            size="small"
            bordered
            :pagination="{ pageSize: 6 }"
            :loading="loading"
          />
        </a-tab-pane>
        <a-tab-pane key="temperature" tab="氣溫">
          <a-table
            :dataSource="temperatureData"
            :columns="temperatureColumns"
            rowKey="place"
            size="small"
            bordered
            :pagination="{ pageSize: 9 }"
            :loading="loading"
          />
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-card>
</template>

<script setup>
import { ref, onMounted, computed, h } from "vue"
import { message } from "ant-design-vue"
import { ReloadOutlined } from "@ant-design/icons-vue"

const loading = ref(true)
const mainWeather = ref({
  temperature: "--",
  description: "",
  humidity: "--",
  icon: ""
})
const updateTime = ref("")
const uvIndex = ref({ value: "--", desc: "" })
const warnings = ref([])

const temperatureData = ref([])
const humidityData = ref([])
const rainfallData = ref([])
const rainfallTime = ref({ start: "", end: "" })

const forecastData = ref([])

const iconUrl = computed(() =>
  mainWeather.value.icon
    ? `https://www.hko.gov.hk/images/HKOWxIconOutline/pic${mainWeather.value.icon}.png`
    : "https://www.hko.gov.hk/images/HKOWxIconOutline/pic50.png"
)

const temperatureColumns = [
  { title: "地區", dataIndex: "place", key: "place" },
  { title: "氣溫 (°C)", dataIndex: "value", key: "value" }
]

const forecastColumns = [
  {
    title: "日期",
    dataIndex: "date",
    key: "date"
  },
  {
    title: "天氣",
    dataIndex: "icon",
    key: "icon",
    customRender: ({ record }) =>
      h("img", {
        src: `https://www.hko.gov.hk/images/HKOWxIconOutline/pic${record.icon}.png`,
        alt: record.desc,
        style: "width:32px;height:32px;vertical-align:middle;margin-right:8px;"
      })
  },
  {
    title: "最低／最高氣溫 (°C)",
    key: "temp",
    customRender: ({ record }) => `${record.minTemp} / ${record.maxTemp}`
  },
  {
    title: "天氣概況",
    dataIndex: "desc",
    key: "desc",
    responsive: ['md'] // Hide on mobile (xs/sm)
  }
]

const iconDescMap = {
  50: "Fine",
  51: "Fine",
  52: "Fine",
  60: "Cloudy",
  61: "Overcast",
  62: "Mist",
  63: "Fog",
  64: "Rain",
  65: "Thunderstorm"
  // ...add more as needed
}

const findHkoStationData = (dataList = []) =>
  dataList.find(
    (d) => d.place === "香港天文台" || d.place === "Hong Kong Observatory"
  )

const fetchWeather = async () => {
  loading.value = true
  try {
    const res = await fetch("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc")
    const data = await res.json()

    // Main weather (Hong Kong Observatory / 香港天文台)
    const hkoTemp = findHkoStationData(data.temperature?.data)
    const hkoHumidity = findHkoStationData(data.humidity?.data)

    mainWeather.value.temperature = hkoTemp?.value ?? "--"
    mainWeather.value.humidity = hkoHumidity?.value ?? "--"
    mainWeather.value.icon = data.icon?.[0] || "50"

    // Format update time to "24 May 2025, 4:16 pm"
    if (data.updateTime) {
      const date = new Date(data.updateTime)
      const day = date.getDate()
      const month = date.toLocaleString("en-US", { month: "short" })
      const year = date.getFullYear()
      let hour = date.getHours()
      const minute = date.getMinutes().toString().padStart(2, "0")
      const ampm = hour >= 12 ? "pm" : "am"
      hour = hour % 12
      hour = hour ? hour : 12 // the hour '0' should be '12'
      updateTime.value = `${day} ${month} ${year}, ${hour}:${minute} ${ampm}`
    } else {
      updateTime.value = ""
    }

    warnings.value = data.warningMessage || []

    // UV Index
    if (data.uvindex?.data?.length) {
      uvIndex.value.value = data.uvindex.data[0].value
      uvIndex.value.desc = data.uvindex.data[0].desc
    } else {
      uvIndex.value = { value: "--", desc: "" }
    }

    // All temperature, humidity, rainfall data
    temperatureData.value = data.temperature?.data || []
    humidityData.value = data.humidity?.data || []
    rainfallData.value = data.rainfall?.data || []
    rainfallTime.value = {
      start: data.rainfall?.startTime?.replace("T", " ").replace("+08:00", ""),
      end: data.rainfall?.endTime?.replace("T", " ").replace("+08:00", "")
    }
  } catch (e) {
    message.error("Failed to fetch weather data")
  }
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const fetchForecast = async () => {
  try {
    const res = await fetch(
      "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc"
    )
    const data = await res.json()
    forecastData.value = (data.weatherForecast || []).map((day) => ({
      date: day.forecastDate
        ? (() => {
            const mm = day.forecastDate.slice(4, 6)
            const dd = day.forecastDate.slice(6, 8)
            const weekday = day.week || ""
            return `${dd}/${mm}${weekday ? ` (${weekday})` : ""}`
          })()
        : "",
      icon: day.ForecastIcon || "50",
      minTemp: day.forecastMintemp?.value ?? "--",
      maxTemp: day.forecastMaxtemp?.value ?? "--",
      desc: day.forecastWeather || ""
    }))
  } catch (e) {
    message.error("Failed to fetch 9-day forecast")
  }
}

const refreshWeather = () => {
  fetchWeather()
  fetchForecast()
}

onMounted(() => {
  fetchWeather()
  fetchForecast()
})
</script>
