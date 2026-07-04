using System.Security.Cryptography.X509Certificates;

namespace linker.messenger
{
    public interface IMessengerStore
    {
        public X509Certificate Certificate { get; }
        public X509Certificate CertificateExport { get; }
    }
}
