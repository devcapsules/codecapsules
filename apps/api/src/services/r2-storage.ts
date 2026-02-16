import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

interface CapsuleJSON {
  id: string
  title: string
  description: string
  type: string
  language?: string
  difficulty: string
  tags: string[]
  content: any
  runtime?: any
  pedagogy?: any
  metadata: {
    version: string
    createdAt: string
    updatedAt: string
  }
}

export class R2StorageService {
  private client: S3Client
  private bucketName: string

  constructor(config: R2Config) {
    this.client = new S3Client({
      region: 'auto', // Cloudflare R2 uses 'auto'
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucketName = config.bucketName
  }

  /**
   * Upload capsule as static JSON to R2
   * @param capsuleId - The capsule ID
   * @param capsule - The capsule data from database
   */
  async uploadCapsuleJSON(capsuleId: string, capsule: any): Promise<void> {
    try {
      // Transform database capsule to optimized CDN format
      const capsuleJSON: CapsuleJSON = {
        id: capsule.id,
        title: capsule.title,
        description: capsule.description,
        type: capsule.type,
        language: capsule.language,
        difficulty: capsule.difficulty,
        tags: capsule.tags || [],
        content: capsule.content,
        runtime: capsule.runtime,
        pedagogy: capsule.pedagogy,
        metadata: {
          version: '1.0',
          createdAt: capsule.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: capsule.updatedAt?.toISOString() || new Date().toISOString(),
        }
      }

      const key = `capsules/${capsuleId}.json`
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(capsuleJSON, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
        Metadata: {
          'capsule-id': capsuleId,
          'version': '1.0',
          'updated-at': new Date().toISOString()
        }
      })

      await this.client.send(command)
      console.log(`✅ Uploaded capsule JSON to R2: ${key}`)

    } catch (error) {
      console.error(`❌ Failed to upload capsule ${capsuleId} to R2:`, error)
      // Don't throw - R2 upload is optional, don't break the main flow
    }
  }

  /**
   * Delete capsule JSON from R2 (when capsule is deleted)
   * @param capsuleId - The capsule ID
   */
  async deleteCapsuleJSON(capsuleId: string): Promise<void> {
    try {
      const key = `capsules/${capsuleId}.json`
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
      console.log(`🗑️ Deleted capsule JSON from R2: ${key}`)

    } catch (error) {
      console.error(`❌ Failed to delete capsule ${capsuleId} from R2:`, error)
      // Don't throw - R2 cleanup is optional
    }
  }

  /**
   * Get the public CDN URL for a capsule
   * @param capsuleId - The capsule ID
   * @returns The public CDN URL
   */
  getCapsuleURL(capsuleId: string): string {
    // Assuming custom domain setup - can fallback to R2 direct URL if needed
    return `https://cdn.devcapsules.com/capsules/${capsuleId}.json`
  }
}

// Factory function to create R2 service from environment
export function createR2Service(): R2StorageService | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn('⚠️ R2 configuration incomplete - CDN uploads disabled')
    return null
  }

  return new R2StorageService({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName
  })
}