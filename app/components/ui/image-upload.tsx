import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Upload, X } from 'lucide-react'
import { Button } from './button'
import { useImageUpload } from '~/features/integrations/storage/use-image-upload'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove?: () => void
    maxSize?: number
    className?: string
    label?: string
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    maxSize,
    className,
    label,
}: ImageUploadProps) {
    const { t } = useTranslation('common')
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(value || null)

    const { upload, uploading, progress, error } = useImageUpload({
        maxSize,
        onSuccess: (url) => {
            setPreview(url)
            onChange(url)
        },
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Generate preview
        const reader = new FileReader()
        reader.onload = (event) => setPreview(event.target?.result as string)
        reader.readAsDataURL(file)

        // Upload with unique key
        const key = `public/uploads/${crypto.randomUUID()}-${file.name}`
        await upload(file, key)
    }

    const handleRemove = () => {
        setPreview(null)
        onRemove?.()
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }

    return (
        <div className={className}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="h-32 w-32"
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs">{progress}%</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">
                                {label || t('uploadImage')}
                            </span>
                        </div>
                    )}
                </Button>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-600">
                    {t(`errors.${error}`)}
                </p>
            )}
        </div>
    )
}
