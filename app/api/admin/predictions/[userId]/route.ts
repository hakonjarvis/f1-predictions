import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'
import { checkAdminAuth } from '@/lib/auth'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Check authentication
  const authResult = checkAdminAuth(request)
  if (authResult) return authResult

  try {
    const { userId: userIdParam } = await params
    const userId = parseInt(userIdParam)

    if (isNaN(userId)) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        )
      )
    }

    // Delete the prediction (cascade will handle driver predictions)
    await dbHelpers.deletePrediction(userId)

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Prediction deleted successfully',
      })
    )
  } catch (error) {
    console.error('Error deleting prediction:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to delete prediction', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}
