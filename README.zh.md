# 2DNS - DNS 反射服务器

2DNS 是一个多功能的 DNS 反射服务器，允许您在域名中编码 IP 地址，并在 DNS 响应中将其反射回来。这对于各种网络应用、诊断和基于 DNS 的服务发现非常有用。

**在线服务:** [2dns.dev](https://2dns.dev)

[English](README.md)

## 功能特点

- 支持 IPv4 和 IPv6 地址
- 多种编码格式:
  - 直接 IPv4 反射
  - 支持多种表示法格式的 IPv6
  - IPv4 和 IPv6 地址的 Base32 编码
  - 双栈支持（在单个域名中同时包含 IPv4 和 IPv6）
- 在多个端口和网络类型上运行，以实现最大兼容性
- 轻量高效的 Go 语言实现

## 安装

### 使用公共服务

您可以直接使用 [2dns.dev](https://2dns.dev) 上的公共 2DNS 服务，无需安装。

### 自行托管

```bash
# 克隆仓库
git clone https://github.com/yourusername/2dns.git
cd 2dns/src

# 构建二进制文件
go build -o 2dns 2dns.go

# 运行服务器
./2dns
```

## 使用方法

[2dns.dev](https://2dns.dev) 上的公共服务监听标准 DNS 端口（53/UDP 和 53/TCP）。

如果您自行托管，服务器会在端口 8053-8058 上监听 DNS 查询，并返回域名中编码的 IP 地址。

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

#### 4. Base32 编码的 IPv6

格式: `<base32-encoded-ipv6>.<domain>`

示例:
```
dig @2dns.dev ABQWY3DPEHBQGAYDAMZRGEZDGN3BGIZTINJWG44DS.2dns.dev AAAA
```

这将返回 `2001:0db8:85a3:0000:0000:8a2e:0370:7334` 作为 AAAA 记录（其中 '8' 替代了填充字符 '='）。

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
