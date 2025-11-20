# Linker MVP（最小可行产品）开发文档

## 项目概述

### 目标
开发一个最小可行的虚拟网络工具，实现类似ZeroTier的基本功能：连接异地设备，创建虚拟局域网。

### 核心功能
1. 虚拟网卡功能
2. P2P连接和中继
3. 简单的网络配置
4. 基本的安全加密

## 技术栈

- **主语言**: C# (.NET 8)
- **网络协议**: TCP/UDP
- **加密**: AES加密
- **跨平台**: Windows、Linux、macOS
- **虚拟网卡**: TUN/TAP设备
- **依赖注入**: Microsoft.Extensions.DependencyInjection

## 开发步骤

### 步骤1: 项目基础架构设置 (第1-2天)

#### 任务1.1: 创建项目结构
```bash
mkdir linker-mvp
cd linker-mvp
dotnet new sln -n LinkerMVP
mkdir src
cd src

# 创建主项目
dotnet new console -n Linker
dotnet sln add Linker/Linker.csproj

# 创建库项目
dotnet new classlib -n Linker.Core
dotnet new classlib -n Linker.Network
dotnet new classlib -n Linker.Tunnel
dotnet new classlib -n Linker.Tuntap
dotnet new classlib -n Linker.Security
dotnet new classlib -n Linker.Config
dotnet sln add Linker.Core/Linker.Core.csproj
dotnet sln add Linker.Network/Linker.Network.csproj
dotnet sln add Linker.Tunnel/Linker.Tunnel.csproj
dotnet sln add Linker.Tuntap/Linker.Tuntap.csproj
dotnet sln add Linker.Security/Linker.Security.csproj
dotnet sln add Linker.Config/Linker.Config.csproj

# 添加项目引用
dotnet add Linker/Linker.csproj reference Linker.Core/Linker.Core.csproj
dotnet add Linker/Linker.csproj reference Linker.Network/Linker.Network.csproj
dotnet add Linker/Linker.csproj reference Linker.Tunnel/Linker.Tunnel.csproj
dotnet add Linker/Linker.csproj reference Linker.Tuntap/Linker.Tuntap.csproj
dotnet add Linker/Linker.csproj reference Linker.Security/Linker.Security.csproj
dotnet add Linker/Linker.csproj reference Linker.Config/Linker.Config.csproj
dotnet add Linker.Network/Linker.Network.csproj reference Linker.Core/Linker.Core.csproj
dotnet add Linker.Tunnel/Linker.Tunnel.csproj reference Linker.Core/Linker.Core.csproj
dotnet add Linker.Tuntap/Linker.Tuntap.csproj reference Linker.Core/Linker.Core.csproj
dotnet add Linker.Security/Linker.Security.csproj reference Linker.Core/Linker.Core.csproj
dotnet add Linker.Config/Linker.Config.csproj reference Linker.Core/Linker.Core.csproj
```

#### 任务1.2: 配置项目依赖
在所有项目中添加以下NuGet包：
```xml
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.0" />
<PackageReference Include="System.Text.Json" Version="8.0.0" />
```

### 步骤2: 核心模型和接口定义 (第3-4天)

#### 任务2.1: 创建核心模型 (Linker.Core)
在`Linker.Core`项目中创建以下文件：

**Models/PeerInfo.cs**
```csharp
using System.Net;

namespace Linker.Core.Models
{
    public class PeerInfo
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public IPEndPoint Endpoint { get; set; }
        public bool IsConnected { get; set; }
        public DateTime LastSeen { get; set; }
    }
}
```

**Models/NetworkConfig.cs**
```csharp
using System.Net;

namespace Linker.Core.Models
{
    public class NetworkConfig
    {
        public string NetworkId { get; set; }
        public string NetworkName { get; set; }
        public IPAddress NetworkAddress { get; set; }
        public byte PrefixLength { get; set; }
        public IPAddress VirtualIP { get; set; }
        public string SecretKey { get; set; }
    }
}
```

#### 任务2.2: 定义核心接口
**Interfaces/INetworkService.cs**
```csharp
using Linker.Core.Interfaces;
using Linker.Core.Models;
using System.Threading.Tasks;

namespace Linker.Core.Interfaces
{
    public interface INetworkService
    {
        Task<bool> StartAsync();
        Task StopAsync();
        Task<bool> ConnectToPeerAsync(PeerInfo peer);
        Task<PeerInfo[]> GetPeersAsync();
        void SendData(byte[] data);
        event EventHandler<byte[]> DataReceived;
    }
}
```

### 步骤3: 网络通信基础 (第5-7天)

#### 任务3.1: 实现基础网络通信 (Linker.Network)
**TcpServer.cs**
```csharp
using Linker.Core.Interfaces;
using Linker.Core.Models;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace Linker.Network
{
    public class TcpServer : INetworkService
    {
        private TcpListener _listener;
        private List<TcpClient> _clients = new List<TcpClient>();
        private bool _isRunning = false;

        public event EventHandler<byte[]> DataReceived;

        public async Task<bool> StartAsync()
        {
            try
            {
                _listener = new TcpListener(IPAddress.Any, 1804);
                _listener.Start();
                _isRunning = true;
                _ = ListenForClients();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start server: {ex.Message}");
                return false;
            }
        }

        private async Task ListenForClients()
        {
            while (_isRunning)
            {
                try
                {
                    var client = await _listener.AcceptTcpClientAsync();
                    _clients.Add(client);
                    _ = HandleClient(client);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error accepting client: {ex.Message}");
                }
            }
        }

        private async Task HandleClient(TcpClient client)
        {
            using (var networkStream = client.GetStream())
            {
                var buffer = new byte[8192];
                while (client.Connected)
                {
                    try
                    {
                        var bytesRead = await networkStream.ReadAsync(buffer, 0, buffer.Length);
                        if (bytesRead > 0)
                        {
                            var data = new byte[bytesRead];
                            Array.Copy(buffer, data, bytesRead);
                            DataReceived?.Invoke(this, data);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error reading from client: {ex.Message}");
                        break;
                    }
                }
            }
        }

        public async Task StopAsync()
        {
            _isRunning = false;
            _listener?.Stop();
            foreach (var client in _clients)
            {
                client.Close();
            }
            _clients.Clear();
        }

        public Task<bool> ConnectToPeerAsync(PeerInfo peer)
        {
            throw new NotImplementedException();
        }

        public Task<PeerInfo[]> GetPeersAsync()
        {
            throw new NotImplementedException();
        }

        public void SendData(byte[] data)
        {
            var tasks = _clients.Select(client =>
            {
                if (client.Connected)
                {
                    var stream = client.GetStream();
                    return stream.WriteAsync(data, 0, data.Length);
                }
                return Task.CompletedTask;
            });
            Task.WaitAll(tasks.ToArray());
        }
    }
}
```

### 步骤4: 安全加密模块 (第8天)

#### 任务4.1: 实现基本加密 (Linker.Security)
**EncryptionService.cs**
```csharp
using System.Security.Cryptography;
using System.Text;

namespace Linker.Security
{
    public class EncryptionService
    {
        private readonly byte[] _key;

        public EncryptionService(string secretKey)
        {
            using (var sha256 = SHA256.Create())
            {
                _key = sha256.ComputeHash(Encoding.UTF8.GetBytes(secretKey));
            }
        }

        public byte[] Encrypt(byte[] data)
        {
            using (var aes = Aes.Create())
            {
                aes.Key = _key;
                aes.GenerateIV();
                
                var encryptor = aes.CreateEncryptor();
                var encrypted = encryptor.TransformFinalBlock(data, 0, data.Length);
                
                var result = new byte[aes.IV.Length + encrypted.Length];
                Array.Copy(aes.IV, 0, result, 0, aes.IV.Length);
                Array.Copy(encrypted, 0, result, aes.IV.Length, encrypted.Length);
                
                return result;
            }
        }

        public byte[] Decrypt(byte[] encryptedData)
        {
            using (var aes = Aes.Create())
            {
                aes.Key = _key;
                var iv = new byte[16];
                var data = new byte[encryptedData.Length - 16];
                
                Array.Copy(encryptedData, 0, iv, 0, 16);
                Array.Copy(encryptedData, 16, data, 0, data.Length);
                
                aes.IV = iv;
                
                var decryptor = aes.CreateDecryptor();
                return decryptor.TransformFinalBlock(data, 0, data.Length);
            }
        }
    }
}
```

### 步骤5: 配置管理 (第9天)

#### 任务5.1: 实现配置管理 (Linker.Config)
**ConfigManager.cs**
```csharp
using Linker.Core.Models;
using System.Text.Json;

namespace Linker.Config
{
    public class ConfigManager
    {
        private readonly string _configPath = "config.json";

        public NetworkConfig LoadConfig()
        {
            if (File.Exists(_configPath))
            {
                var json = File.ReadAllText(_configPath);
                return JsonSerializer.Deserialize<NetworkConfig>(json);
            }
            return new NetworkConfig();
        }

        public void SaveConfig(NetworkConfig config)
        {
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_configPath, json);
        }

        public NetworkConfig CreateDefaultConfig()
        {
            var config = new NetworkConfig
            {
                NetworkId = Guid.NewGuid().ToString(),
                NetworkName = "Default Network",
                NetworkAddress = System.Net.IPAddress.Parse("10.10.0.0"),
                PrefixLength = 24,
                VirtualIP = System.Net.IPAddress.Parse("10.10.0.100"),
                SecretKey = GenerateSecretKey()
            };
            
            SaveConfig(config);
            return config;
        }

        private string GenerateSecretKey()
        {
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                var bytes = new byte[32];
                rng.GetBytes(bytes);
                return Convert.ToBase64String(bytes);
            }
        }
    }
}
```

### 步骤6: 虚拟网卡接口 (第10-12天)

#### 任务6.1: 定义TUN/TAP接口 (Linker.Tuntap)
**ITunDevice.cs**
```csharp
using System.Net;

namespace Linker.Tuntap
{
    public interface ITunDevice
    {
        bool CreateDevice(string name, IPAddress address, byte prefixLength);
        bool StartDevice();
        bool StopDevice();
        bool WriteData(byte[] data);
        event EventHandler<byte[]> DataReceived;
    }
}
```

#### 任务6.2: Windows TUN/TAP实现
由于TUN/TAP设备需要操作系统级别的权限和特殊的驱动程序，我们先创建一个模拟实现用于测试：

**MockTunDevice.cs**
```csharp
using System.Net;

namespace Linker.Tuntap
{
    public class MockTunDevice : ITunDevice
    {
        public event EventHandler<byte[]> DataReceived;

        private string _name;
        private IPAddress _address;
        private byte _prefixLength;
        private bool _isRunning = false;

        public bool CreateDevice(string name, IPAddress address, byte prefixLength)
        {
            _name = name;
            _address = address;
            _prefixLength = prefixLength;
            Console.WriteLine($"Mock TUN device created: {_name} with IP {_address}/{_prefixLength}");
            return true;
        }

        public bool StartDevice()
        {
            _isRunning = true;
            Console.WriteLine("Mock TUN device started");
            return true;
        }

        public bool StopDevice()
        {
            _isRunning = false;
            Console.WriteLine("Mock TUN device stopped");
            return true;
        }

        public bool WriteData(byte[] data)
        {
            if (!_isRunning) return false;
            
            Console.WriteLine($"Mock TUN device wrote {data.Length} bytes");
            // 在真实实现中，这里会将数据发送到虚拟网卡
            return true;
        }

        public void SimulateDataReceived(byte[] data)
        {
            if (_isRunning)
            {
                DataReceived?.Invoke(this, data);
            }
        }
    }
}
```

### 步骤7: P2P连接核心 (第13-15天)

#### 任务7.1: 实现P2P连接管理 (Linker.Tunnel)
**P2PConnectionManager.cs**
```csharp
using Linker.Core.Models;

namespace Linker.Tunnel
{
    public class P2PConnectionManager
    {
        private readonly Dictionary<string, PeerInfo> _peers = new Dictionary<string, PeerInfo>();
        private readonly object _lock = new object();

        public void AddPeer(PeerInfo peer)
        {
            lock (_lock)
            {
                _peers[peer.Id] = peer;
            }
        }

        public PeerInfo GetPeer(string id)
        {
            lock (_lock)
            {
                return _peers.ContainsKey(id) ? _peers[id] : null;
            }
        }

        public PeerInfo[] GetAllPeers()
        {
            lock (_lock)
            {
                return _peers.Values.ToArray();
            }
        }

        public bool RemovePeer(string id)
        {
            lock (_lock)
            {
                return _peers.Remove(id);
            }
        }

        public async Task<bool> ConnectToPeerAsync(PeerInfo peer)
        {
            // 这里将实现实际的P2P连接逻辑
            // 包括NAT穿透、中继连接等
            Console.WriteLine($"Attempting to connect to peer {peer.Name} at {peer.Endpoint}");
            
            // 模拟连接过程
            await Task.Delay(1000); // 模拟连接时间
            
            peer.IsConnected = true;
            peer.LastSeen = DateTime.Now;
            AddPeer(peer);
            
            Console.WriteLine($"Connected to peer {peer.Name}");
            return true;
        }
    }
}
```

### 步骤8: 主程序集成 (第16-18天)

#### 任务8.1: 创建主程序 (Linker项目)
**Program.cs**
```csharp
using Linker.Config;
using Linker.Core.Interfaces;
using Linker.Core.Models;
using Linker.Network;
using Linker.Security;
using Linker.Tunnel;
using Linker.Tuntap;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("Starting Linker MVP...");
        
        // 初始化配置
        var configManager = new ConfigManager();
        var config = configManager.LoadConfig();
        
        if (config.NetworkId == null)
        {
            config = configManager.CreateDefaultConfig();
            Console.WriteLine($"Created new network: {config.NetworkName} ({config.NetworkId})");
            Console.WriteLine($"Virtual IP: {config.VirtualIP}");
            Console.WriteLine($"Secret Key: {config.SecretKey}");
        }
        else
        {
            Console.WriteLine($"Joined network: {config.NetworkName} ({config.NetworkId})");
            Console.WriteLine($"Virtual IP: {config.VirtualIP}");
        }

        // 初始化加密服务
        var encryptionService = new EncryptionService(config.SecretKey);

        // 初始化网络服务
        var networkService = new TcpServer();

        // 初始化P2P连接管理器
        var p2pManager = new P2PConnectionManager();

        // 初始化虚拟网卡（使用模拟实现）
        var tunDevice = new MockTunDevice();
        tunDevice.CreateDevice("linker0", config.VirtualIP, config.PrefixLength);
        tunDevice.StartDevice();

        // 设置事件处理
        networkService.DataReceived += (sender, data) =>
        {
            try
            {
                var decryptedData = encryptionService.Decrypt(data);
                Console.WriteLine($"Received encrypted data, decrypted length: {decryptedData.Length}");
                
                // 将解密后的数据传递给虚拟网卡
                tunDevice.WriteData(decryptedData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error decrypting data: {ex.Message}");
            }
        };

        tunDevice.DataReceived += (sender, data) =>
        {
            // 将虚拟网卡收到的数据加密并发送到网络
            var encryptedData = encryptionService.Encrypt(data);
            networkService.SendData(encryptedData);
            Console.WriteLine($"Forwarded data to network, encrypted length: {encryptedData.Length}");
        };

        // 启动网络服务
        if (await networkService.StartAsync())
        {
            Console.WriteLine("Network service started successfully");

            // 模拟添加一个对等点
            var mockPeer = new PeerInfo
            {
                Id = "peer-002",
                Name = "Remote Machine",
                Endpoint = System.Net.IPEndPoint.Parse("192.168.1.100:1804"),
                IsConnected = false,
                LastSeen = DateTime.Now
            };

            // 尝试连接到对等点
            _ = p2pManager.ConnectToPeerAsync(mockPeer);

            Console.WriteLine("Linker MVP is running. Press any key to stop...");
            Console.ReadKey();

            // 清理资源
            await networkService.StopAsync();
            tunDevice.StopDevice();
        }
        else
        {
            Console.WriteLine("Failed to start network service");
        }
    }
}
```

### 步骤9: 测试和验证 (第19-20天)

#### 任务9.1: 编写测试用例
创建一个简单的测试来验证各个模块的协同工作：

**TestClient.cs**
```csharp
// 简单的测试客户端，用于验证连接
using System.Net.Sockets;

class TestClient
{
    static async Task Main(string[] args)
    {
        try
        {
            using (var client = new TcpClient())
            {
                await client.ConnectAsync("127.0.0.1", 1804);
                var stream = client.GetStream();
                
                var testData = System.Text.Encoding.UTF8.GetBytes("Hello from test client!");
                await stream.WriteAsync(testData, 0, testData.Length);
                
                Console.WriteLine("Test data sent successfully");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Test client error: {ex.Message}");
        }
    }
}
```

#### 任务9.2: 集成测试
1. 启动主程序
2. 运行测试客户端
3. 验证数据是否能够正确传输、加密、解密和转发

### 步骤10: 文档和部署 (第21天)

#### 任务10.1: 创建用户手册
创建一个简单的README.md文件，说明如何运行和使用这个MVP版本：

```
# Linker MVP

## 快速开始

1. 安装.NET 8 SDK
2. 克隆项目
3. 编译: `dotnet build`
4. 运行: `dotnet run`

## 配置

首次运行会自动创建配置文件 `config.json`，包含网络ID、虚拟IP等信息。

## 当前限制

- 使用模拟TUN设备（无实际网络接口）
- 仅支持TCP连接
- 有限的P2P功能
```

## 项目架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Program  │    │   Network       │    │   Security      │
│                 │    │                 │    │                 │
│ - Config Mgmt   │◄──►│ - TCP Server    │◄──►│ - AES Encrypt/  │
│ - Service Coord │    │ - Peer Mgmt     │    │   Decrypt       │
│ - Event Handling│    │ - Data Forward  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   TUN/TAP       │
                    │                 │
                    │ - Virtual NIC   │
                    │ - Data I/O      │
                    │   (Mock impl)   │
                    └─────────────────┘
```

## 下一步改进

1. 实现真实的TUN/TAP设备支持（Windows: Wintun, Linux: tun/tap, macOS: utun）
2. 添加UDP支持和NAT穿透功能
3. 实现中继服务器功能
4. 优化加密和性能
5. 添加用户界面

## 预期成果

通过这21天的开发，你将获得一个具备以下功能的MVP产品：

1. 虚拟网络接口（模拟实现）
2. 加密通信
3. 配置管理
4. 基础网络服务
5. 简单的P2P连接管理

这个MVP版本虽然功能有限，但已经包含了核心组件，可以作为进一步开发的基础。