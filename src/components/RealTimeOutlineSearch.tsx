import React, { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { FileText, Download, Clock, User, Calendar, Award, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRealTimePageCount } from '../hooks/useRealTimePageCount'

interface OutlineFile {
  id: string
  title: string
  course: string
  instructor: string
  year: string
  type: string
  pages: number
  rating: number
  file_path: string
  file_type: 'pdf' | 'docx'
  created_at: string
  updated_at: string
}

export function RealTimeOutlineSearch() {
  const [outlines, setOutlines] = useState<OutlineFile[]>([])
  const [filteredOutlines, setFilteredOutlines] = useState<OutlineFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { 
    isUpdating, 
    updateProgress, 
    updatingFiles,
    getOutlinesWithRealTimePageCounts,
    updateSingleOutline
  } = useRealTimePageCount()

  // Fetch outlines with real-time page count updates
  const fetchOutlines = async () => {
    setLoading(true)
    try {
      const searchParams = {
        course: selectedCourse || undefined,
        instructor: selectedInstructor || undefined,
        year: selectedYear || undefined,
        type: selectedType || undefined
      }
      
      const outlinesWithPageCounts = await getOutlinesWithRealTimePageCounts(searchParams)
      setOutlines(outlinesWithPageCounts)
      setFilteredOutlines(outlinesWithPageCounts)
    } catch (error) {
      console.error('Error fetching outlines:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchOutlines()
  }, [])

  // Filter outlines based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOutlines(outlines)
      return
    }

    const filtered = outlines.filter(outline =>
      outline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outline.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outline.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOutlines(filtered)
  }, [searchTerm, outlines])

  // Get unique values for filters
  const uniqueCourses = [...new Set(outlines.map(o => o.course))].sort()
  const uniqueInstructors = [...new Set(outlines.map(o => o.instructor))].sort()
  const uniqueYears = [...new Set(outlines.map(o => o.year))].sort()
  const uniqueTypes = [...new Set(outlines.map(o => o.type))].sort()

  const handleDownload = async (outline: OutlineFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('Outlines')
        .download(outline.file_path)
      
      if (error) {
        console.error('Error downloading file:', error)
        return
      }
      
      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = outline.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleRefreshPageCount = async (outline: OutlineFile) => {
    try {
      const updatedOutline = await updateSingleOutline(outline)
      
      // Update the outline in the state
      setOutlines(prev => prev.map(o => o.id === outline.id ? updatedOutline : o))
      setFilteredOutlines(prev => prev.map(o => o.id === outline.id ? updatedOutline : o))
    } catch (error) {
      console.error('Error refreshing page count:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DS': return 'bg-green-100 text-green-800'
      case 'H': return 'bg-blue-100 text-blue-800'
      case 'P': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search outlines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={fetchOutlines} disabled={loading || isUpdating}>
              {loading || isUpdating ? 'Loading...' : 'Search'}
            </Button>
          </div>
          
          {isUpdating && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Updating page counts in real-time... {updateProgress}%</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Courses</SelectItem>
                {uniqueCourses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="All Instructors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Instructors</SelectItem>
                {uniqueInstructors.map(instructor => (
                  <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {filteredOutlines.length} outline{filteredOutlines.length !== 1 ? 's' : ''} found
          </h3>
        </div>
        
        <div className="grid gap-4">
          {filteredOutlines.map((outline) => (
            <Card key={outline.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-lg">{outline.title}</h4>
                    <Badge className={getTypeColor(outline.type)}>
                      {outline.type}
                    </Badge>
                    {updatingFiles.has(outline.id) && (
                      <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{outline.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{outline.course}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{outline.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span className={outline.pages === 1 ? 'text-orange-600 font-medium' : ''}>
                        {outline.pages} page{outline.pages !== 1 ? 's' : ''}
                      </span>
                      {outline.pages === 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshPageCount(outline)}
                          disabled={updatingFiles.has(outline.id)}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleDownload(outline)}
                  className="ml-4"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredOutlines.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No outlines found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </Card>
        )}
      </div>
    </div>
  )
}


