// Define types for tracking events
export interface TrackingEvent {
  event: string // e.g., "view_post", "like_post"
  userId: string // from URL parameter
  postId: number // from the post data
  postOwner: string // username from the post data
  timestamp: number // timestamp when the event started
  duration?: number // for view events, how long they viewed the post
  value?: any // additional data specific to the event
}

export interface ExportResponse {
  success: boolean
  message: string
}
