import { Skeleton } from './skeleton';

/**
 * Reusable skeleton loader components for better perceived performance
 * These replace loading spinners with content-shaped placeholders
 */

/**
 * Skeleton for a feed post card
 */
export function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for a list of posts
 */
export function PostsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a message in chat
 */
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
        <div className={`rounded-lg p-3 ${isOwn ? 'bg-[#752432]' : 'bg-gray-100'}`}>
          <Skeleton className={`h-4 w-32 mb-2 ${isOwn ? 'bg-white/20' : ''}`} />
          <Skeleton className={`h-4 w-24 ${isOwn ? 'bg-white/20' : ''}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for conversation list
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for outline/exam table row
 */
export function OutlineRowSkeleton() {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 px-4">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="py-3 px-4">
        <Skeleton className="h-4 w-20" />
      </td>
    </tr>
  );
}

/**
 * Skeleton for outline/exam table
 */
export function OutlinesTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Title</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Course</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Instructor</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Pages</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Year</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, i) => (
            <OutlineRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton for calendar event
 */
export function CalendarEventSkeleton() {
  return (
    <div className="border border-gray-200 rounded p-2 mb-2">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Skeleton for calendar day
 */
export function CalendarDaySkeleton() {
  return (
    <div className="min-h-[120px] p-2 border border-gray-200">
      <Skeleton className="h-4 w-6 mb-2" />
      <CalendarEventSkeleton />
      <CalendarEventSkeleton />
    </div>
  );
}

/**
 * Skeleton for page loading (replaces spinner)
 */
export function PageSkeleton() {
  return (
    <div className="h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}

