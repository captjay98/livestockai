import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import {
    getListingDetailFn,
    recordListingViewFn,
} from '~/features/marketplace/server'
import { ListingDetail } from '~/components/marketplace/listing-detail'
import { ContactSellerDialog } from '~/components/marketplace/contact-seller-dialog'
import { Button } from '~/components/ui/button'

const listingDetailSearchSchema = z.object({
    viewerLatitude: z.number().min(-90).max(90).optional(),
    viewerLongitude: z.number().min(-180).max(180).optional(),
})

export const Route = createFileRoute('/marketplace/$listingId')({
    validateSearch: listingDetailSearchSchema,

    loaderDeps: ({ params, search }: any) => ({
        listingId: params.listingId,
        viewerLatitude: search.viewerLatitude,
        viewerLongitude: search.viewerLongitude,
    }),

    loader: async ({ deps }) => {
        return getListingDetailFn({ data: deps })
    },

    component: ListingDetailPage,
})

function ListingDetailPage() {
    const { t } = useTranslation('marketplace')
    const listing = Route.useLoaderData()
    const { listingId } = Route.useParams()
    const router = useRouter()
    const [showContactDialog, setShowContactDialog] = useState(false)
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)

    // Record view on mount
    useEffect(() => {
        recordListingViewFn({ data: { listingId } }).catch(() => {
            // Ignore errors for view recording
        })
    }, [listingId])

    const handleContactSeller = () => {
        // Check if user is authenticated
        // Since this is a public route, we need to check auth status
        // For now, show login prompt - in real app, check session
        setShowLoginPrompt(true)
    }

    const handleLoginRedirect = () => {
        router.navigate({
            to: '/login',
        })
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/marketplace">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('backToMarketplace')}
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ListingDetail 
                        listing={listing} 
                        isOwner={false}
                        onContactClick={handleContactSeller}
                    />
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        {!listing.isOwner && (
                            <Button
                                onClick={handleContactSeller}
                                className="w-full"
                                size="lg"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {t('contactSeller')}
                            </Button>
                        )}

                        {listing.sellerVerification && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="font-medium text-green-900 mb-2">
                                    {t('verifiedSeller')}
                                </h3>
                                <p className="text-sm text-green-700">
                                    {t('verifiedSellerDescription')}
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-medium mb-2">
                                {t('safetyTips')}
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• {t('safetyTip1')}</li>
                                <li>• {t('safetyTip2')}</li>
                                <li>• {t('safetyTip3')}</li>
                                <li>• {t('safetyTip4')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Prompt Dialog */}
            {showLoginPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            {t('loginRequired')}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {t('loginRequiredDescription')}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleLoginRedirect}
                                className="flex-1"
                            >
                                {t('loginSignUp')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowLoginPrompt(false)}
                                className="flex-1"
                            >
                                {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Dialog - only shown if authenticated */}
            <ContactSellerDialog
                listingId={listingId}
                open={showContactDialog}
                onOpenChange={setShowContactDialog}
                onSubmit={() => setShowContactDialog(false)}
            />
        </div>
    )
}
