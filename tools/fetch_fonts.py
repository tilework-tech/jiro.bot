"""Install the approved General Sans webfonts from Fontshare."""
import hashlib
import io
import pathlib
import urllib.request
import zipfile

SOURCE = "https://api.fontshare.com/v2/fonts/download/general-sans"
DESTINATION = pathlib.Path(__file__).resolve().parent.parent / "site" / "fonts"
ASSETS = {
    "GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Regular.woff2":
        ("GeneralSans-400.woff2", "1336dc6137440a94f87d883bcc3ee26bdbd580606d61e89e6e530757d9328886"),
    "GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Medium.woff2":
        ("GeneralSans-500.woff2", "0168813e5da4bb7fcbffbe1305cc4932220772ff26c0488c5d62e28f579aa5ae"),
    "GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Semibold.woff2":
        ("GeneralSans-600.woff2", "225c2c18bd1cebdd9c4aedc07201d5a5fd086f44d5418c09bce308a0832ccfcf"),
    "GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Bold.woff2":
        ("GeneralSans-700.woff2", "0bb4361798c57a448ca3bb9aa251b5a2290f6d79b006edd4161e1962d0eafa26"),
    "GeneralSans_Complete/License/FFL.txt":
        ("GeneralSans-FFL.txt", "145e7fe2429a3336ba215c070ef722000e01348a3e1baaa127e871bb5012f554"),
}

def install_fonts(archive, destination, assets):
    """Verify every approved member before writing any file; ignore other members."""
    verified = {}
    with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
        for source, (filename, digest) in assets.items():
            data = bundle.read(source)
            if hashlib.sha256(data).hexdigest() != digest:
                raise ValueError(f"Fontshare checksum mismatch for {source}; review upstream files and license before updating pins")
            verified[filename] = data
    destination.mkdir(parents=True, exist_ok=True)
    for filename, data in verified.items():
        (destination / filename).write_bytes(data)


def main():
    with urllib.request.urlopen(SOURCE, timeout=60) as response:
        archive = response.read()
    install_fonts(archive, DESTINATION, ASSETS)
    print(f"Installed verified General Sans weights 400, 500, 600, 700 and license in {DESTINATION}")


if __name__ == "__main__":
    main()
