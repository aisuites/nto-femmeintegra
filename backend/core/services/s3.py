class S3Client:
    """Stub para integrações com S3."""

    def upload_requisicao_image(self, file_obj, path: str) -> str:
        """Futuro: envia arquivo para bucket S3 e retorna URL pública."""
        # TODO: implementar integração real com boto3
        return f"https://s3.mock/{path}"
