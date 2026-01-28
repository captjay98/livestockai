import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, User } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { Label } from '~/components/ui/label'

const ROLE_STORAGE_KEY = 'app-role-view'

export type RoleView = 'farmer' | 'extension'

interface RoleSwitcherProps {
    hasFarmAccess: boolean
    hasExtensionAccess: boolean
    onRoleChange?: (role: RoleView) => void
}

export function RoleSwitcher({
    hasFarmAccess,
    hasExtensionAccess,
    onRoleChange,
}: RoleSwitcherProps) {
    const { t } = useTranslation(['common'])
    const [currentRole, setCurrentRole] = useState<RoleView>('farmer')

    // Only show if user has both types of access
    const showSwitcher = hasFarmAccess && hasExtensionAccess

    useEffect(() => {
        const savedRole = localStorage.getItem(ROLE_STORAGE_KEY)
        if (savedRole === 'farmer' || savedRole === 'extension') {
            setCurrentRole(savedRole)
        }
    }, [])

    const handleRoleChange = (value: string | null) => {
        if (value === 'farmer' || value === 'extension') {
            setCurrentRole(value)
            localStorage.setItem(ROLE_STORAGE_KEY, value)
            onRoleChange?.(value)
        }
    }

    if (!showSwitcher) {
        return null
    }

    return (
        <div className="space-y-2 p-3 border-t">
            <Label className="text-xs font-medium text-muted-foreground">
                {t('common:viewMode', { defaultValue: 'View Mode' })}
            </Label>
            <Select value={currentRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="farmer">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>
                                {t('common:farmerView', {
                                    defaultValue: 'Farmer View',
                                })}
                            </span>
                        </div>
                    </SelectItem>
                    <SelectItem value="extension">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                                {t('common:extensionView', {
                                    defaultValue: 'Extension View',
                                })}
                            </span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export function useRoleView(): RoleView {
    const [roleView, setRoleView] = useState<RoleView>('farmer')

    useEffect(() => {
        const savedRole = localStorage.getItem(ROLE_STORAGE_KEY)
        if (savedRole === 'farmer' || savedRole === 'extension') {
            setRoleView(savedRole)
        }
    }, [])

    return roleView
}
