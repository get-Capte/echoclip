<template>
  <div
    class="items-start justify-center gap-6 rounded-lg p-6 md:grid lg:grid-cols-1 xl:grid-cols-1"
  >
    <div class="z-10 col-span-2 grid items-start gap-6 lg:col-span-1">
      <Container>
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-xl"> Type a sentence</CardTitle>
            <CardDescription>
              You can type anything : "comment ça va ?"
            </CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="grid grid-cols-2 gap-6">
              <div class="input-group">
                <Input id="jwtToken" v-model="searchPhrase" />
              </div>
              <Button @click="query()">Search</Button>
            </div>
          </CardContent>
          <CardFooter> </CardFooter>
        </Card>
      </Container>
    </div>
    <Container>
      <div>
        <video
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
  import { ref } from 'vue'
  import { supabase } from '@/lib/supabaseClient' // Adjust the path as necessary
  import Container from '@/components/Container.vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
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

  function loadVideo(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (videoPlayer.value) {
        const video = videoPlayer.value as HTMLVideoElement
        console.log('video', video)
        if (!video) {
          reject('Video player not found')
          return
        }

        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          resolve()
        }
        const onCanPlayThrough = () => {
          video.removeEventListener('canplaythrough', onCanPlayThrough)
          resolve()
        }

        video.addEventListener('canplaythrough', onCanPlayThrough)
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        console.log('Loading video:', videoUrl.value)
        if (video.readyState === 4) {
          console.log('The video is ready to play through.')
        } else {
          console.log('The video is not yet ready to play through.')
        }
        video.load() // Trigger reload of video to ensure loadedmetadata fires
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
        await loadVideo() // Reload the video player with the new URL
      }
      await playVideoSegment(segment.startTime, segment.endTime)
    }
  }

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
        video.currentTime = convertToSeconds(startTime)
        video.play()

        const onTimeUpdate = () => {
          if (video.currentTime >= convertToSeconds(endTime)) {
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
