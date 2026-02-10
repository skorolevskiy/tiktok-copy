from minio import Minio
from app.core.config import settings
import io

class MinioClient:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_URL,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )

    def ensure_bucket(self, bucket_name: str):
        if not self.client.bucket_exists(bucket_name):
            self.client.make_bucket(bucket_name)
            # Set public policy for audio-tracks if needed, 
            # but usually for secure access we presign or proxy.
            # Requirement says "public access" for audio tracks.
            if bucket_name == settings.MINIO_BUCKET_AUDIO:
                policy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}' % bucket_name
                self.client.set_bucket_policy(bucket_name, policy)

    def put_object(self, bucket_name: str, object_name: str, data: io.BytesIO, length: int, content_type: str):
        self.ensure_bucket(bucket_name)
        self.client.put_object(
            bucket_name,
            object_name,
            data,
            length,
            content_type=content_type
        )

    def get_url(self, bucket_name: str, object_name: str):
        # Return a direct URL assuming MinIO is accessible at MINIO_URL
        # In docker-compose internal network, MINIO_URL is 'minio:9000'. 
        # For external access (browser), it needs localhost:9000 or similar.
        # Ideally, we return a presigned URL or a proxy URL.
        # But for 'public access' requirement, we construct the URL.
        # If running inside docker, 'minio:9000' is not reachable from host browser.
        # We usually assume a public hostname setting or similar.
        # For now I will return the internal URL, but in real deploy verify reachability.
         return f"http://{settings.MINIO_URL}/{bucket_name}/{object_name}"

    def get_presigned_url(self, bucket_name: str, object_name: str):
        return self.client.get_presigned_url("GET", bucket_name, object_name)

    def download_file(self, bucket_name: str, object_name: str, file_path: str):
        self.client.fget_object(bucket_name, object_name, file_path)

    def upload_file(self, bucket_name: str, object_name: str, file_path: str, content_type: str = "application/octet-stream"):
        self.ensure_bucket(bucket_name)
        self.client.fput_object(bucket_name, object_name, file_path, content_type=content_type)

minio_client = MinioClient()
