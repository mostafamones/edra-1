import { updateInstructor } from "@/lib/db/instructors";
import { createClient } from "@/utils/supabase/server";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { errors } from "@/lib/api/response";

/**
 * POST /api/profile/avatar
 *
 * Body: {
 *   originalImage: string (base64)
 *   croppedImage: string (base64)
 *   originalExtension: string
 * }
 *
 * Uploads both the original image and cropped version to storage.
 * - Original is saved as {userId}/original.{ext}
 * - Cropped is saved as {userId}/cropped.{ext}
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    const body = await request.json();
    const { originalImage, croppedImage, originalExtension } = body;

    if (!originalImage || !croppedImage) {
      return errors.badRequest("Both original and cropped images are required");
    }

    // Validate base64 images
    if (!isValidBase64Image(originalImage) || !isValidBase64Image(croppedImage)) {
      return errors.badRequest("Invalid image data");
    }

    // Convert base64 to blob
    const originalBlob = await base64ToBlob(originalImage);
    const croppedBlob = await base64ToBlob(croppedImage, 'image/jpeg');

    // File paths
    const originalPath = `${user.id}/original.${originalExtension}`;
    const croppedPath = `${user.id}/cropped.jpg`;

    // Delete old avatar files if they exist
    const adminClient = getServiceSupabase();
    const { data: listData } = await (adminClient as any)
      .storage
      .from('avatars')
      .list(user.id);

    if (listData) {
      for (const file of listData) {
        await (adminClient as any)
          .storage
          .from('avatars')
          .remove([`${user.id}/${file.name}`]);
      }
    }

    // Upload original image
    const originalContentType = getContentType(originalExtension);
    const { error: originalError } = await supabase.storage
      .from('avatars')
      .upload(originalPath, originalBlob, { contentType: originalContentType, upsert: true });

    if (originalError) {
      console.error("Error uploading original image:", originalError);
      return errors.internal("Failed to upload original image");
    }

    // Upload cropped image
    const { error: croppedError } = await supabase.storage
      .from('avatars')
      .upload(croppedPath, croppedBlob, { contentType: 'image/jpeg', upsert: true });

    if (croppedError) {
      console.error("Error uploading cropped image:", croppedError);
      return errors.internal("Failed to upload cropped image");
    }

    // Get public URL for cropped image (this is the one we'll display)
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(croppedPath);

    const newAvatarUrl = publicData.publicUrl;

    // Update instructor with both paths
    await updateInstructor(user.id, {
      avatar_url: newAvatarUrl,
      original_avatar_path: originalPath,
    });

    // Update auth metadata
    await supabase.auth.updateUser({
      data: { avatar_url: newAvatarUrl }
    });

    return NextResponse.json({
      avatar_url: newAvatarUrl,
      original_avatar_path: originalPath,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return errors.internal("Failed to upload avatar");
  }
}

/**
 * DELETE /api/profile/avatar
 *
 * Removes the avatar from the instructor's profile.
 * Note: Does not delete the storage files (they'll remain orphaned).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    // Update instructor to remove avatar URLs
    await updateInstructor(user.id, {
      avatar_url: null,
      original_avatar_path: null,
    });

    // Remove from auth metadata
    await supabase.auth.updateUser({
      data: { avatar_url: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return errors.internal("Failed to remove avatar");
  }
}

/**
 * GET /api/profile/avatar/original
 *
 * Returns the original avatar image for re-crop.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    // Get instructor to find the original avatar path
    const { data: instructor } = await supabase
      .from('instructors')
      .select('original_avatar_path')
      .eq('id', user.id)
      .single();

    if (!instructor?.original_avatar_path) {
      return errors.notFound("No original avatar found");
    }

    // Get signed URL for original image (private access)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(instructor.original_avatar_path, 3600); // 1 hour expiry

    if (signedError) {
      // Fallback to public URL if signed fails
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(instructor.original_avatar_path);

      return NextResponse.json({ url: publicData.publicUrl, isPublic: true });
    }

    return NextResponse.json({ url: signedData.signedUrl, isPublic: false });
  } catch (error) {
    console.error("Error fetching original avatar:", error);
    return errors.internal("Failed to fetch original avatar");
  }
}

// Helper functions

function isValidBase64Image(base64: string): boolean {
  if (!base64 || typeof base64 !== 'string') return false;
  // Check if it starts with data:image/
  const dataUrlRegex = /^data:image\/[a-z]+;base64,/i;
  return dataUrlRegex.test(base64);
}

async function base64ToBlob(base64: string, mimeType?: string): Promise<Blob> {
  // Extract the base64 data
  const matches = base64.match(/^data:([a-z]+\/[a-z]+);base64,(.+)$/i);
  if (!matches) {
    throw new Error('Invalid base64 string');
  }

  const type = mimeType || matches[1];
  const data = matches[2];

  const bytes = atob(data);
  const buffer = new ArrayBuffer(bytes.length);
  const byteArray = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    byteArray[i] = bytes.charCodeAt(i);
  }

  return new Blob([buffer], { type });
}

function getContentType(extension: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return types[extension.toLowerCase()] || 'image/jpeg';
}
