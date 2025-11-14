import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminAuth } from '@/lib/auth'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Check authentication
  const authResult = checkAdminAuth(request)
  if (authResult) return authResult

  try {
    const userId = parseInt(params.userId)

    if (isNaN(userId)) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        )
      )
    }

    // Find the user's prediction
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { prediction: true },
    })

    if (!user) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      )
    }

    if (!user.prediction) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'User has no prediction to delete' },
          { status: 404 }
        )
      )
    }

    // Delete the season prediction (this will cascade delete driver predictions)
    await prisma.seasonPrediction.delete({
      where: { id: user.prediction.id },
    })

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
