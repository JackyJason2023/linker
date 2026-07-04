using linker.libs;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace linker.messenger.store.file.messenger
{
    public class MessengerStore : IMessengerStore
    {
        public X509Certificate Certificate => certificate;
        public X509Certificate CertificateExport => certificateExport;

        private readonly FileConfig fileConfig;

        private X509Certificate2 certificate;
        private X509Certificate2 certificateExport;
        public MessengerStore(FileConfig fileConfig)
        {
            this.fileConfig = fileConfig;

            using Stream streamPublic = Assembly.GetExecutingAssembly().GetManifestResourceStream($"linker.messenger.store.file.publickey.pem");
            using Stream streamPrivate = Assembly.GetExecutingAssembly().GetManifestResourceStream($"linker.messenger.store.file.privatekey.pem");

            using StreamReader readerPublic = new StreamReader(streamPublic);
            using StreamReader readerPrivate = new StreamReader(streamPrivate);

            RSA rsaPrivateKey = RSA.Create();
            rsaPrivateKey.ImportFromPem(readerPrivate.ReadToEnd());

            using X509Certificate2 publicCert = X509Certificate2.CreateFromPem(readerPublic.ReadToEnd());
            certificate = publicCert.CopyWithPrivateKey(rsaPrivateKey);

            //不导出不支持windows什么的
            byte[] pfxBytes = certificate.Export(X509ContentType.Pfx, Helper.GlobalString);
            certificateExport = new X509Certificate2(pfxBytes, Helper.GlobalString, X509KeyStorageFlags.Exportable);

            if (OperatingSystem.IsAndroid() == false)
            {
                byte[] pfxBytes1 = certificate.Export(X509ContentType.Pfx, Helper.GlobalString);
                certificate.Dispose();
                certificate = new X509Certificate2(pfxBytes1, Helper.GlobalString);
            }
        }
    }
}
