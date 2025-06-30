# 2DNS - DNS 反射服务器

2DNS 是一个多功能的 DNS 反射服务器，允许您在域名中编码 IP 地址，并在 DNS 响应中反射这些地址。这对于各种网络应用、诊断和基于 DNS 的服务发现非常有用。

**在线服务：** 2dns.dev | [GitHub Pages (英文)](https://aiaid.github.io/2dns/en/) | [GitHub Pages (中文)](https://aiaid.github.io/2dns/zh/)

[English](README.md) | [文档](docs/README.md)

## 最新更新

### v1.1.0 - 界面颜色优化
- 🎨 **修复了白天模式下文字颜色问题**：将所有白色文字替换为自适应颜色，确保在浅色背景下文字清晰可见
- 🌈 **新增响应式文字颜色系统**：
  - `text-adaptive`: 主要文字颜色，白天模式为深色，夜间模式为浅色
  - `text-adaptive-secondary`: 次要文字颜色
  - `text-adaptive-muted`: 弱化文字颜色
- 🎭 **优化了背景渐变**：白天模式使用浅色渐变背景，提升整体视觉体验
- ✅ **添加了测试用例**：确保颜色修复的正确性和持续性

## 功能特点

- 支持 IPv4 和 IPv6 地址
- 多种编码格式:
  - 直接 IPv4 反射
  - 支持多种表示法格式的 IPv6
  - IPv4 和 IPv6 地址的 Base32 编码（大小写不敏感）
  - 双栈支持（在单个域名中同时包含 IPv4 和 IPv6）
- 在多个端口和网络类型上运行，以实现最大兼容性
- 轻量高效的 Go 语言实现

## 安装

### 使用公共服务

您可以直接使用 [2dns.dev](https://2dns.dev) 上的公共 2DNS 服务，无需安装。

### 自行托管

#### 选项 1: 从源代码构建

```bash
# 克隆仓库
git clone https://github.com/Aiaid/2dns.git
cd 2dns/src

# 构建二进制文件
go build -o 2dns 2dns.go

# 运行服务器
./2dns
```

#### 选项 2: 使用 Docker

您可以使用 DockerHub 上的预构建 Docker 镜像：

```bash
# 拉取镜像
docker pull aiaid/2dns

# 运行容器
docker run -p 53:53/udp -p 53:53/tcp aiaid/2dns
```

或者使用 docker-compose：

```bash
# 克隆仓库
git clone https://github.com/Aiaid/2dns.git
cd 2dns/docker

# 使用 docker-compose 运行
docker-compose up -d
```

## 使用方法

[2dns.dev](https://2dns.dev) 上的公共服务监听标准 DNS 端口（53/UDP 和 53/TCP）。

如果您自行托管，服务器会在端口 8053-8058 上监听 DNS 查询，并返回域名中编码的 IP 地址。

### 命令行选项

```bash
./2dns [选项]
```

可用选项:
- `-mode`: 运行模式: `dev` 或 `production` (默认: `dev`)
- `-port`: 指定端口号 (覆盖模式默认端口)
- `-csv`: 包含 DNS 记录的 CSV 文件路径
- `-ttl`: 指定 TTL 值（秒）（0 表示使用模式默认值）
- `-verbose`: 启用详细日志记录（覆盖模式默认设置）

### CSV 文件支持

除了 IP 反射功能外，2DNS 还可以从 CSV 文件提供传统的 DNS 记录。这允许您将 2DNS 用作域名的简单权威 DNS 服务器。

#### CSV 文件格式

CSV 文件应具有以下列:
- `name`: 域名 (例如, `example.com` 或 `*.example.com` 用于通配符记录)
- `type`: DNS 记录类型 (A, AAAA, CNAME, MX, TXT 等)
- `value`: 记录值
- `ttl`: (可选) 生存时间，以秒为单位 (如果未指定，则默认为服务器的 TTL)
- `priority`: (可选) MX 和 SRV 记录的优先级
- `weight`: (可选) SRV 记录的权重
- `port`: (可选) SRV 记录的端口

CSV 文件示例:
```csv
name,type,value,ttl,priority,weight,port
example.com,A,192.168.1.1,3600,,,
example.com,AAAA,2001:db8::1,3600,,,
example.com,TXT,"这是一条测试记录",3600,,,
www.example.com,CNAME,example.com,3600,,,
example.com,MX,mail.example.com,3600,10,,
_sip._tcp.example.com,SRV,sip.example.com,3600,10,20,5060
*.example.com,A,192.168.1.2,3600,,,
```

#### 支持的记录类型

- **A**: IPv4 地址记录
- **AAAA**: IPv6 地址记录
- **CNAME**: 规范名称记录
- **MX**: 邮件交换记录
- **NS**: 名称服务器记录
- **PTR**: 指针记录
- **SOA**: 权威起始记录
- **SRV**: 服务记录
- **TXT**: 文本记录
- **CAA**: 证书颁发机构授权记录
- **ALIAS**: 类似于 CNAME，但可以用于区域顶点（根域名）。在 DNS 服务器级别解析。
- **ANAME**: 类似于 ALIAS，但专门用于 A/AAAA 解析。自动解析为目标域名的 A 或 AAAA 记录。

#### 通配符记录

通配符记录使用 `*` 字符支持。例如，`*.example.com` 将匹配任何没有显式记录的 `example.com` 子域。

#### 使用示例

```bash
./2dns -csv records.csv
```

当收到 DNS 查询时，2DNS 将:
1. 首先检查 CSV 文件中是否有匹配的记录
2. 如果没有找到匹配项，则回退到 IP 反射功能

### 支持的格式

#### 1. 直接 IPv4 反射

格式: `<ipv4>.<domain>`

示例:
```
dig @2dns.dev 1.2.3.4.2dns.dev A
```

这将返回 `1.2.3.4` 作为 A 记录。

#### 2. IPv6 反射

2DNS 支持多种 IPv6 表示法格式:

##### 完整格式

格式: `xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx.<domain>`

示例:
```
dig @2dns.dev 2001-0db8-85a3-0000-0000-8a2e-0370-7334.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录。

##### 省略前导零的格式

格式: `<ipv6-with-omitted-zeros>.<domain>`

示例:
```
dig @2dns.dev 2001-db8-85a3-0-0-8a2e-370-7334.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录。

##### 使用 'z' 表示零组的格式

格式: `<prefix>z<suffix>.<domain>` （其中 'z' 表示一个或多个连续的全零组）

示例:
```
dig @2dns.dev 2001-db8-85a3-z-8a2e-370-7334.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录。

#### 3. Base32 编码的 IPv4

格式: `<base32-encoded-ipv4>.<domain>`

示例:
```
dig @2dns.dev AEBAGBA8.2dns.dev A
```

这将返回 `1.2.3.4` 作为 A 记录（AEBAGBA8 是 1.2.3.4 的 Base32 编码，其中 '8' 替代了填充字符 '='）。

注意：Base32 编码对大小写不敏感。支持大写和小写字母，因为小写字母在解码前会自动转换为大写。

#### 4. Base32 编码的 IPv6

格式: `<base32-encoded-ipv6>.<domain>`

示例:
```
dig @2dns.dev ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录（其中 '8' 替代了填充字符 '='）。

注意：与 IPv4 一样，IPv6 的 Base32 编码也对大小写不敏感。

#### 5. 双栈（IPv4 + IPv6）

格式: `<base32-encoded-ipv4><base32-encoded-ipv6>.<domain>`

IPv4 示例:
```
dig @2dns.dev AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev A
```

这将返回 `1.2.3.4` 作为 A 记录。

IPv6 示例:
```
dig @2dns.dev AEBAGBA8ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录。

注意：双栈编码也对大小写不敏感，允许在 Base32 编码部分使用大写和小写字母。

## 技术细节

服务器尝试在多个端口（8053-8058）和网络类型（udp、tcp、udp6、tcp6）上启动，以实现最大兼容性。它将为每种网络类型使用第一个可用的端口。

处理 DNS 查询时，服务器会:

1. 尝试将域名解析为直接的 IPv4 或 IPv6 地址
2. 如果失败，尝试将其解析为 Base32 编码的 IPv4 或 IPv6 地址
3. 如果失败，尝试将其解析为双栈地址（同时包含 IPv4 和 IPv6）
4. 如果成功，返回适当的 DNS 记录（IPv4 为 A 记录，IPv6 为 AAAA 记录）

## 许可证

MIT 许可证

版权所有 (c) 2025

特此免费授予任何获得本软件及相关文档文件（"软件"）副本的人不受限制地处理本软件的权利，
包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或销售软件副本的权利，
并允许向其提供本软件的人员这样做，但须符合以下条件：

上述版权声明和本许可声明应包含在本软件的所有副本或重要部分中。

本软件按"原样"提供，不提供任何形式的明示或暗示的保证，包括但不限于对适销性、
特定用途的适用性和非侵权性的保证。在任何情况下，作者或版权持有人均不对任何索赔、
损害或其他责任负责，无论是在合同诉讼、侵权行为或其他方面，由软件或软件的使用或
其他交易引起的或与之相关的。

## 贡献

欢迎贡献！请随时提交 Pull Request。

## GitHub Actions 和 DockerHub 集成

本项目使用 GitHub Actions 进行自动化 Docker 镜像构建。有关详细的设置说明，请参阅 [GITHUB_SETUP.zh.md](GITHUB_SETUP.zh.md)。
