<template>
  <div
    class="items-start justify-center gap-6 rounded-lg p-6 md:grid lg:grid-cols-1 xl:grid-cols-1"
  >
    <div class="z-10 col-span-2 grid items-start gap-6 lg:col-span-1">
      <Container>
        <div class="grid grid-cols-2 gap-6">
          <div class="input-group">
            <Input id="searchPhrase" v-model="searchPhrase" />
          </div>
          <Button @click="query()">Search</Button>
        </div>
      </Container>
    </div>
    <Container>
      <div>
        <video
          id="videoPlayer"
          :key="videoUrl"
          ref="videoPlayer"
          width="320"
          height="240"
          controls
          class="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source :src="videoUrl" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
  interface Segment {
    startTime: string
    endTime: string
    textContent: string
    url: string
  }
  import { nextTick, ref, watch } from 'vue'
  import { useDebounceFn } from '@vueuse/core'
  import { supabase } from '@/lib/supabaseClient' // Adjust the path as necessary
  import Container from '@/components/Container.vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'

  const searchPhrase = ref('')
  const videoUrl = ref('')
  const videoPlayer = ref(null)

  const query = async () => {
    if (searchPhrase.value) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select()
          .textSearch('srt', `'${searchPhrase.value}'`)

        if (error) {
          console.error('Error:', error)
        } else {
          console.log('Search results:', data)
          let allSegments: Segment[] = []
          if (data && data.length > 0) {
            data.forEach((videoData) => {
              const segments: Segment[] = extractTimeFromSRT(
                videoData.srt,
                searchPhrase.value,
                videoData.url
              )
              allSegments = allSegments.concat(segments)
            })

            playSegmentsSequentially(allSegments)
          }
        }
      } catch (err) {
        console.error('Query error:', err)
      }
    }
  }
  const debouncedQuery = useDebounceFn(query, 500) // 500 ms throttle

  function loadVideo(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (videoPlayer.value) {
        const video = videoPlayer.value as HTMLVideoElement
        if (!video) {
          reject('Video player not found')
          return
        }

        const onLoadedMetadata = () => {
          console.log('onLoadedMetadata')
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          resolve()
        }
        const onCanPlay = () => {
          console.log('onCanPlay')
          video.removeEventListener('canplay', onCanPlay)
          resolve()
        }
        const onCanPlayThrough = () => {
          console.log('onCanPlayThrough')
          video.removeEventListener('canplaythrough', onCanPlayThrough)
          resolve()
        }
        console.log('video dom: ', video)
        video.addEventListener('canplaythrough', onCanPlayThrough)
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)

        console.log('Loading video:', videoUrl.value)
        video.load() // Trigger reload of video to ensure loadedmetadata fires
        if (video.readyState === 4) {
          console.log('The video is ready to play through.')
        } else {
          console.log(
            'The video is not yet ready to play through.',
            video.readyState
          )
        }
      } else {
        reject('Video player element is not available')
      }
    })
  }

  const playSegmentsSequentially = async (segments: Segment[]) => {
    console.log('Playing segments:', segments)
    for (const segment of segments) {
      if (
        videoPlayer.value &&
        (videoPlayer.value as HTMLVideoElement).src !== segment.url
      ) {
        videoUrl.value = segment.url
        await nextTick(async () => {
          await loadVideo()
          await playVideoSegment(segment.startTime, segment.endTime)
        })
        // await loadVideo() // Reload the video player with the new URL
      }
    }
  }

  watch(searchPhrase, () => {
    debouncedQuery()
  })

  async function playVideoSegment(
    startTime: string,
    endTime: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (videoPlayer.value) {
        const video = videoPlayer.value as HTMLVideoElement
        if (!video) {
          reject('Video player not found')
          return
        }
        console.log('Playing segment:', startTime, endTime)
        if (convertToSeconds(startTime) - 0.5 < 0) {
          video.currentTime = convertToSeconds(startTime)
        } else {
          video.currentTime = convertToSeconds(startTime) - 0.5
        }
        video.play()

        const onTimeUpdate = () => {
          if (video.currentTime >= convertToSeconds(endTime) + 0.5) {
            video.pause()
            video.removeEventListener('timeupdate', onTimeUpdate)
            resolve()
          }
        }

        video.addEventListener('timeupdate', onTimeUpdate)
      } else {
        reject('Video player not found')
      }
    })
  }

  function convertToSeconds(timeString: string): number {
    const [hours, minutes, secondsAndMillis] = timeString.split(':')
    const [seconds, millis] = secondsAndMillis.split(',')
    return (
      Number(hours) * 3600 +
      Number(minutes) * 60 +
      Number(seconds) +
      Number(millis) / 1000
    )
  }

  function extractTimeFromSRT(
    srtContent: string,
    searchPhrase: string,
    videoUrl: string
  ): Segment[] {
    const results: Segment[] = []
    const srtEntries = srtContent.split('\n\n')

    srtEntries.forEach((entry) => {
      const lines = entry.split('\n')
      if (lines.length >= 3) {
        const timeRange = lines[1]
        const textContent = lines.slice(2).join(' ')

        if (textContent.toLowerCase().includes(searchPhrase.toLowerCase())) {
          const [startTime, endTime] = timeRange.split(' --> ')
          results.push({ startTime, endTime, textContent, url: videoUrl })
        }
      }
    })

    return results
  }
</script>

<style></style>
