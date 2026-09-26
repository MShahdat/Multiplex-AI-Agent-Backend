import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { CLOUDINARY } from '../../lib/cloudinary.js';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedUser } from '../../interface/index.js';
import { UserStatus } from '../../../../generated/prisma/enums.js';
import { startWith } from 'rxjs';

export interface ImageUploadFile {
  buffer: Buffer;
  size: number;
  mimetype: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB


@Injectable()
export class UserService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinaryClient: typeof cloudinary,
  ) { }

  async uploadFile(user: AuthenticatedUser, file: ImageUploadFile) {

    if (!file) {
      throw new BadRequestException('An image file is required');
    }

    if (MAX_FILE_SIZE < file.size) {
      throw new BadRequestException(`Image must be ${MAX_FILE_SIZE} MB or smaller`)
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Must be image uploaded')
    }

    const isUser = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    })

    if (!isUser) {
      throw new NotFoundException('User not found!')
    }

    if (isUser.status === UserStatus.BLOCKED) {
      throw new BadRequestException('User is temporary blocked. Please unblocked first')
    }

    if (isUser.status === UserStatus.DELETED || isUser.isDeleted) {
      throw new BadRequestException('User is deleted')
    }

    const uploadedImage = await new Promise<UploadApiResponse>((resolve, reject) => {
      this.cloudinaryClient.uploader.upload_stream(
        {
          folder: 'Multiplex AI Agents/Profile',
          resource_type: "image"
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('Cloudinary returned no upload result'));
          } else {
            resolve(result);
          }
        },
      ).end(file.buffer);
    });

    const transactionRes = await prisma.$transaction(
      async (tx) => {
        const updateUser = tx.user.update({
          where: {
            id: user.id
          },
          data: {
            imageURL: uploadedImage.secure_url,
            imagePublicId: uploadedImage.public_id,
          },
          omit: {
            password: true
          }
        });

        if (uploadedImage && isUser.imageURL && isUser.imagePublicId) {
          cloudinary.uploader.destroy(isUser.imagePublicId, {
            invalidate: true
          })
          console.log('previous file deleted')
        }

        return updateUser
      },
      {
        maxWait: 10000,
        timeout: 15000
      }
    )

    return transactionRes
  }
}
