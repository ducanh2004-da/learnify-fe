// src/features/courses/UploadForm.tsx (hoặc nơi bạn để file)
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, FileText, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { lessonService } from '@/features/courses'

// MUI
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

type FileUploadStatus = 'idle' | 'uploading' | 'done' | 'error'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (match constant)
const ALLOWED_TYPES = ['application/pdf']

interface UploadFormProps {
  courseId: string
  open?: boolean
  onClose?: () => void
}

export default function UploadForm({ courseId, open = false, onClose }: UploadFormProps) {
  const theme = useTheme()
  const { user: authUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState<boolean>(open)
  useEffect(() => setDialogOpen(open), [open])

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileUploadStatus>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [formValue, setFormValue] = useState({ lessonName: '', abstract: '' })

  const processingRef = useRef(false);

  useEffect(() => {
    const initial: Record<string, FileUploadStatus> = {}
    for (const f of uploadedFiles) initial[`${f.name}-${f.size}`] = 'idle'
    setFileStatuses((prev) => ({ ...initial, ...prev }))
  }, [uploadedFiles.length]) // eslint-disable-line

  // --- useMutation: call lessonService.createLesson directly ---
  const createLessonMutation = useMutation({
    mutationFn: async ({ file, courseId, lessonName, abstract }: { file: File; courseId: string; lessonName: string; abstract: string }) => {
      return await lessonService.createLesson(file, courseId, lessonName, abstract)
    },
    onSuccess: (_data, vars) => {
      // invalidate lessons for this course (vars may be undefined in TS inference; we call with courseId below)
      queryClient.invalidateQueries({ queryKey: ['lessons', vars?.courseId ?? courseId] })
    },
    onError: (err: any) => {
      console.error('createLessonMutation error:', err)
    }
  })

  // helpers
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => (file.type === 'application/pdf' ? <FileIcon className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-blue-500" />)
  const getStatusIcon = (status: FileUploadStatus) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }
  const getStatusText = (status: FileUploadStatus) => {
    switch (status) {
      case 'uploading':
        return <span className="text-xs text-blue-600">Đang xử lý...</span>
      case 'done':
        return <span className="text-xs text-green-600">Hoàn thành</span>
      case 'error':
        return <span className="text-xs text-red-600">Lỗi</span>
      default:
        return null
    }
  }

  // drag/file handlers
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const list = Array.from(e.dataTransfer.files)
    const files = list.filter((file) => ALLOWED_TYPES.includes(file.type))
    if (files.length === 0) {
      toast.error('Chỉ hỗ trợ file PDF')
      return
    }
    // dedupe by name+size
    setUploadedFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const next = [...prev]
      for (const f of files) {
        const key = `${f.name}-${f.size}`
        if (!existing.has(key)) next.push(f)
      }
      return next
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement
    setFormValue((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const list = Array.from(e.target.files)
      const files = list.filter((file) => ALLOWED_TYPES.includes(file.type))
      if (files.length === 0) {
        toast.error('Chỉ hỗ trợ file PDF')
        return
      }
      setUploadedFiles((prev) => {
        const existing = new Set(prev.map((f) => `${f.name}-${f.size}`))
        const next = [...prev]
        for (const f of files) {
          const key = `${f.name}-${f.size}`
          if (!existing.has(key)) next.push(f)
        }
        return next
      })
      e.currentTarget.value = ''
    }
  }

  const removeFile = (index: number) => {
    const toRemove = uploadedFiles[index]
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setFileStatuses((prev) => {
      const copy = { ...prev }
      delete copy[`${toRemove.name}-${toRemove.size}`]
      return copy
    })
  }

  // main create
  async function handleCreate() {
    if (!courseId) {
      toast.error('Không có courseId. Vui lòng truyền courseId vào component.')
      return
    }
    if (!authUser?.id) {
      toast.error('Vui lòng đăng nhập để tạo bài giảng.')
      return
    }
    if (!formValue.lessonName || formValue.lessonName.trim() === '') {
      toast.error('Vui lòng nhập tên bài học')
      return
    }
    if (!formValue.abstract || formValue.abstract.trim() === '') {
      toast.error('Vui lòng nhập mô tả bài học')
      return
    }
    if (uploadedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 file PDF để upload.')
      return
    }

    // validate
    for (const file of uploadedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} không phải là PDF.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} lớn hơn ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        return
      }
    }

    setIsProcessing(true)
    const results: { file: File; success: boolean; lessonId?: string; error?: string }[] = []

    const initialStatuses: Record<string, FileUploadStatus> = {}
    for (const file of uploadedFiles) initialStatuses[`${file.name}-${file.size}`] = 'idle'
    setFileStatuses(initialStatuses)

    toast.info(`Bắt đầu xử lý ${uploadedFiles.length} file...`)

    for (const file of uploadedFiles) {
      const key = `${file.name}-${file.size}`
      try {
        setFileStatuses((prev) => ({ ...prev, [key]: 'uploading' }))
        const { lessonName, abstract } = formValue
        const lessonResult: any = await createLessonMutation.mutateAsync({ file, courseId, lessonName, abstract })
        setFileStatuses((prev) => ({ ...prev, [key]: 'done' }))
        results.push({ file, success: true, lessonId: lessonResult?.lesson_id ?? lessonResult?.lessonId })
        toast.success(`✓ ${file.name} đã xử lý xong`)
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error)
        setFileStatuses((prev) => ({ ...prev, [key]: 'error' }))
        const message = error?.message || 'Unknown error'
        results.push({ file, success: false, error: message })
        toast.error(`✗ ${file.name}: ${message}`)
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    if (successCount === uploadedFiles.length) {
      toast.success(`🎉 Hoàn thành! Đã tạo ${successCount} bài giảng thành công.`, { duration: 5000 })
      setUploadedFiles([])
      setFormValue({ lessonName: '', abstract: '' })
      handleLocalClose()
    } else if (successCount > 0) {
      toast.warning(`Kết thúc: ${successCount} thành công, ${failCount} thất bại.`, { duration: 5000 })
    } else {
      toast.error('Không có file nào được xử lý thành công.')
    }

    setIsProcessing(false)
  }

  const handleLocalClose = () => {
    if (isProcessing) return
    setDialogOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      <Button variant="outlined" onClick={() => setDialogOpen(true)} disabled={isProcessing}>
        Tải lên
      </Button>

      <Dialog open={dialogOpen} onClose={handleLocalClose} fullWidth maxWidth="md">
        <DialogTitle>Tải lên tài liệu để tạo bài giảng (AI)</DialogTitle>
        <DialogContent>
          <div className="mb-4">
            <div>Tải lên các file PDF. Hệ thống sẽ tự động tạo bài học cho khoá học hiện tại.</div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-3">
              <div className="text-sm text-yellow-800">Gợi ý: Tải lên từng bài học, mỗi bài học là 1 file pdf</div>
            </div>
          </div>

          <Box component="div" sx={{ mt: 2 }}>
            <Card className={`shadow-lg border-0`}>
              <CardHeader>
                <CardTitle className="text-xl">Upload Tài Liệu</CardTitle>
                <CardDescription>Hiện tại chỉ hỗ trợ tài liệu pdf (tối đa {MAX_FILE_SIZE / (1024 * 1024)}MB mỗi file)</CardDescription>
              </CardHeader>

              <CardContent>
                <TextField
                  autoFocus
                  required
                  margin="dense"
                  id="lessonName"
                  name="lessonName"
                  label="Tên bài học"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formValue.lessonName}
                  onChange={handleInputChange}
                />

                <TextField
                  margin="dense"
                  id="abstract"
                  name="abstract"
                  label="Mô tả (tóm tắt)"
                  type="text"
                  fullWidth
                  variant="outlined"
                  multiline
                  minRows={4}
                  value={formValue.abstract}
                  onChange={handleInputChange}
                />

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (!isProcessing && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
                  }}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kéo thả file PDF vào đây</h3>

                  <input ref={inputRef} type="file" multiple accept=".pdf,application/pdf" onChange={handleFileInput} className="hidden" id="file-upload" disabled={isProcessing} />

                  <Label htmlFor="file-upload">
                    <div className="inline-block mx-auto cursor-pointer border border-gray-300 px-4 py-2 rounded-md bg-white hover:bg-gray-50">Chọn File PDF</div>
                  </Label>

                  <p className="text-sm text-gray-500 mt-3">Chỉ hỗ trợ PDF. Tối đa {MAX_FILE_SIZE / (1024 * 1024)}MB mỗi file.</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-900">File Đã Chọn ({uploadedFiles.length})</h4>
                    {uploadedFiles.map((file, index) => {
                      const key = `${file.name}-${file.size}`
                      const status = fileStatuses[key] ?? 'idle'
                      return (
                        <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${status === 'done' ? 'bg-green-50 border-green-200' : status === 'error' ? 'bg-red-50 border-red-200' : status === 'uploading' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-2">
                            {getStatusIcon(status)}
                            {getStatusText(status)}
                            <Button variant="text" size="small" onClick={() => removeFile(index)} disabled={status === 'uploading' || isProcessing} sx={{ ml: 1 }}>
                              Xóa
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleLocalClose} disabled={isProcessing}>Hủy</Button>
          <Button onClick={() => handleCreate()} disabled={isProcessing || uploadedFiles.length === 0}>
            {isProcessing ? 'Đang xử lý...' : 'Tạo bài giảng từ AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
